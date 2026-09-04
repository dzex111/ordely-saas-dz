"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { orders, shipments, shippingCredentials } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { denyUnless } from "@/lib/team";
import { wilayaByCode } from "@/lib/algeria";
import { ECOTRACK_COMPANIES, getProvider, type ShippingInput } from "@/lib/shipping";
import type { FormState } from "./auth";

function shippingGuard() {
  return (async () => {
    const { store, user } = await requireStore();
    if (!hasFeature(store.plan, "shippingIntegrations")) {
      return { denied: "Les intégrations livraison nécessitent le plan PRO." } as const;
    }
    return { store, user } as const;
  })();
}

/** Save (or replace) courier credentials after a LIVE connection test. */
export async function saveCredentialsAction(_: FormState, formData: FormData): Promise<FormState> {
  const g = await shippingGuard();
  if ("denied" in g) return { error: g.denied };
  const { store, user } = g;
  const denied = await denyUnless(store, user, "manageSettings");
  if (denied) return { error: denied };

  const parsed = z
    .object({ provider: z.string(), company: z.string().optional(), label: z.string().trim().max(60).optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Données invalides." };
  const provider = getProvider(parsed.data.provider);
  if (!provider) return { error: "Transporteur inconnu." };

  const creds: Record<string, string> = {};
  for (const f of provider.credentialFields) {
    // company select for EcoTrack comes as its own field; baseUrl only when needed.
    if (provider.id === "ecotrack" && f.key === "company") continue;
    const v = String(formData.get(`cred_${f.key}`) ?? "").trim();
    if (!v) return { error: `Le champ « ${f.label} » est requis.` };
    creds[f.key] = v;
  }
  let company: string | null = null;
  let baseUrl: string | null = null;
  if (provider.id === "ecotrack") {
    company = String(formData.get("company") ?? "").trim() || null;
    if (!company) return { error: "Choisissez la société (DHD, Conexlog…). " };
    const known = ECOTRACK_COMPANIES.find((c) => c.id === company);
    if (!known) return { error: "Société inconnue." };
    baseUrl = String(formData.get("baseUrl") ?? "").trim() || null;
    if (!known.baseUrl && !baseUrl) return { error: "Collez l’URL API de votre transporteur (https://…)." };
    if (baseUrl && !/^https:\/\//.test(baseUrl)) return { error: "L’URL API doit commencer par https://." };
    creds.company = company;
    if (baseUrl) creds.baseUrl = baseUrl;
  }

  // Live test BEFORE saving — wrong keys never get stored.
  const test = await provider.testConnection(creds);
  if (!test.ok) return { error: test.error };

  await db.delete(shippingCredentials).where(
    and(
      eq(shippingCredentials.storeId, store.id),
      eq(shippingCredentials.provider, provider.id),
      company ? eq(shippingCredentials.company, company) : isNull(shippingCredentials.company),
    ),
  );
  await db.insert(shippingCredentials).values({
    storeId: store.id,
    provider: provider.id,
    company,
    label: parsed.data.label || provider.label,
    credentials: creds,
    isActive: true,
    lastTestAt: new Date(),
    lastTestOk: true,
  });
  revalidatePath("/dashboard/settings");
  return { success: `${provider.label} connecté et vérifié.` };
}

export async function removeCredentialsAction(id: string) {
  const g = await shippingGuard();
  if ("denied" in g) return { error: g.denied };
  const { store, user } = g;
  const denied = await denyUnless(store, user, "manageSettings");
  if (denied) return { error: denied };
  await db.delete(shippingCredentials).where(and(eq(shippingCredentials.id, id), eq(shippingCredentials.storeId, store.id)));
  revalidatePath("/dashboard/settings");
  return { success: "Transporteur déconnecté." };
}

function toInput(order: typeof orders.$inferSelect, company?: string | null): ShippingInput {
  const w = wilayaByCode(order.wilayaCode);
  return {
    reference: `ORD-${String(order.number).padStart(4, "0")}`,
    fullName: order.customerName,
    phone: order.customerPhone,
    address: order.address || order.commune,
    commune: order.commune,
    wilayaCode: order.wilayaCode,
    wilayaName: w?.name ?? order.wilayaCode,
    deliveryType: order.deliveryType === "desk" ? "desk" : "home",
    productList: order.items.map((i) => `${i.name} x${i.qty}`).join(", ").slice(0, 500),
    codAmount: order.total,
    note: order.customerNote || undefined,
    company: company ?? undefined,
  };
}

/** Create the shipment at the courier. ORDELY only manages — shipping is paid by the merchant. */
export async function createShipmentAction(orderId: string, credentialId: string): Promise<FormState> {
  const g = await shippingGuard();
  if ("denied" in g) return { error: g.denied };
  const { store, user } = g;
  const denied = await denyUnless(store, user, "manageOrders");
  if (denied) return { error: denied };

  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.storeId, store.id)) });
  if (!order) return { error: "Commande introuvable." };
  const existing = await db.query.shipments.findFirst({ where: eq(shipments.orderId, order.id) });
  if (existing) return { error: `Déjà expédiée (${existing.trackingNumber}).` };
  const cred = await db.query.shippingCredentials.findFirst({
    where: and(eq(shippingCredentials.id, credentialId), eq(shippingCredentials.storeId, store.id), eq(shippingCredentials.isActive, true)),
  });
  if (!cred) return { error: "Transporteur introuvable ou désactivé." };
  const provider = getProvider(cred.provider);
  if (!provider) return { error: "Transporteur inconnu." };

  try {
    const created = await provider.createShipment(cred.credentials as Record<string, string>, toInput(order, cred.company));
    await db.insert(shipments).values({
      storeId: store.id,
      orderId: order.id,
      provider: provider.id,
      company: cred.company,
      trackingNumber: created.trackingNumber,
      labelUrl: created.labelUrl ?? null,
      status: created.status,
      lastCheckedAt: new Date(),
      raw: (created.raw ?? {}) as Record<string, unknown>,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Échec de création chez le transporteur." };
  }
  revalidatePath(`/dashboard/orders/${order.id}`);
  return { success: "Expédition créée." };
}

export async function refreshShipmentAction(shipmentId: string): Promise<FormState> {
  const g = await shippingGuard();
  if ("denied" in g) return { error: g.denied };
  const { store, user } = g;
  const denied = await denyUnless(store, user, "manageOrders");
  if (denied) return { error: denied };
  const ship = await db.query.shipments.findFirst({ where: and(eq(shipments.id, shipmentId), eq(shipments.storeId, store.id)) });
  if (!ship) return { error: "Expédition introuvable." };
  const cred = await db.query.shippingCredentials.findFirst({
    where: and(eq(shippingCredentials.storeId, store.id), eq(shippingCredentials.provider, ship.provider)),
  });
  if (!cred) return { error: "Transporteur déconnecté." };
  const provider = getProvider(ship.provider);
  if (!provider) return { error: "Transporteur inconnu." };
  try {
    const info = await provider.trackShipment(cred.credentials as Record<string, string>, ship.trackingNumber);
    await db.update(shipments).set({ status: info.status, lastCheckedAt: new Date(), raw: (info.raw ?? {}) as Record<string, unknown>, updatedAt: new Date() }).where(eq(shipments.id, ship.id));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Suivi indisponible." };
  }
  revalidatePath(`/dashboard/orders/${ship.orderId}`);
  return { success: "Statut actualisé." };
}

export async function cancelShipmentAction(shipmentId: string): Promise<FormState> {
  const g = await shippingGuard();
  if ("denied" in g) return { error: g.denied };
  const { store, user } = g;
  const denied = await denyUnless(store, user, "manageOrders");
  if (denied) return { error: denied };
  const ship = await db.query.shipments.findFirst({ where: and(eq(shipments.id, shipmentId), eq(shipments.storeId, store.id)) });
  if (!ship) return { error: "Expédition introuvable." };
  const cred = await db.query.shippingCredentials.findFirst({
    where: and(eq(shippingCredentials.storeId, store.id), eq(shippingCredentials.provider, ship.provider)),
  });
  if (!cred) return { error: "Transporteur déconnecté." };
  const provider = getProvider(ship.provider);
  if (!provider) return { error: "Transporteur inconnu." };
  try {
    await provider.cancelShipment(cred.credentials as Record<string, string>, ship.trackingNumber);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Annulation refusée." };
  }
  await db.update(shipments).set({ status: "cancelled", updatedAt: new Date() }).where(eq(shipments.id, ship.id));
  revalidatePath(`/dashboard/orders/${ship.orderId}`);
  return { success: "Expédition annulée." };
}
