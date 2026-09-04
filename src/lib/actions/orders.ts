"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { customers, orderEvents, orders, products, stores, ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { clientIp } from "@/lib/rate-limit";
import { normalizePhone, wilayaByCode } from "@/lib/algeria";
import { computeDeliveryFee, ORDER_TRANSITIONS } from "@/lib/commerce";
import type { FormState } from "./auth";

/* ----------------------------- public checkout ----------------------------- */

const checkoutSchema = z.object({
  storeId: z.string().uuid(),
  productId: z.string().uuid(),
  idempotencyKey: z.string().min(16).max(80),
  name: z.string().trim().min(3, "Votre nom complet est requis.").max(80),
  phone: z.string().trim().min(9, "Numéro de téléphone requis."),
  wilaya: z.string().length(2, "Choisissez votre wilaya."),
  commune: z.string().trim().min(2, "Indiquez votre commune.").max(80),
  address: z.string().trim().max(200).default(""),
  deliveryType: z.enum(["home", "desk"]).default("home"),
  qty: z.coerce.number().int().min(1).max(20).default(1),
  variant: z.string().trim().max(120).default(""),
  note: z.string().trim().max(300).default(""),
  website: z.string().max(0).optional(), // honeypot
});

export async function placeOrderAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const phone = normalizePhone(d.phone);
  if (!phone) return { error: "Numéro invalide. Format attendu : 05, 06 ou 07 suivi de 8 chiffres." };
  const wilaya = wilayaByCode(d.wilaya);
  if (!wilaya) return { error: "Wilaya inconnue." };
  if (d.deliveryType === "home" && d.address.length < 5) return { error: "Adresse de livraison requise pour la livraison à domicile." };

  const store = await db.query.stores.findFirst({ where: eq(stores.id, d.storeId) });
  if (!store || !store.published || store.suspended) return { error: "Boutique indisponible." };

  // 5 orders / hour / IP / store — blocks fake-order floods against merchants.
  const ip = await clientIp();
  const hourAgo = new Date(Date.now() - 3600_000);
  const recentOrders = await db.query.orders.findMany({
    where: and(eq(orders.storeId, store.id), eq(orders.ip, ip), gte(orders.createdAt, hourAgo)),
    columns: { id: true },
    limit: 5,
  });
  if (recentOrders.length >= 5) return { error: "Trop de commandes. Réessayez dans une heure." };
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, d.productId), eq(products.storeId, store.id), eq(products.status, "active")),
  });
  if (!product) return { error: "Ce produit n’est plus disponible." };
  if (product.stock !== null && product.stock < d.qty) {
    return { error: product.stock === 0 ? "Produit épuisé." : `Seulement ${product.stock} en stock.` };
  }
  if (product.options.length > 0) {
    const parts = d.variant ? d.variant.split(" / ") : [];
    const valid =
      parts.length === product.options.length &&
      product.options.every((opt, i) => opt.values.includes(parts[i] ?? ""));
    if (!valid) return { error: "Choisissez toutes les options (taille, couleur…)." };
  }

  const subtotal = product.price * d.qty;
  const deliveryFee = computeDeliveryFee(store.settings, wilaya.code, d.deliveryType, subtotal);
  const total = subtotal + deliveryFee;

  // Idempotency: double-submit or retry returns the same order.
  const dup = await db.query.orders.findFirst({
    where: and(eq(orders.storeId, store.id), eq(orders.idempotencyKey, d.idempotencyKey)),
    columns: { id: true },
  });
  if (dup) redirect(`/${store.subdomain}/merci/${dup.id}`);

  let orderId: string | null = null;
  try {
    orderId = await db.transaction(async (tx) => {
      const [{ seq }] = await tx
        .update(stores)
        .set({ orderSeq: sql`${stores.orderSeq} + 1` })
        .where(eq(stores.id, store.id))
        .returning({ seq: stores.orderSeq });

      const [customer] = await tx
        .insert(customers)
        .values({ storeId: store.id, phone, name: d.name, wilayaCode: wilaya.code, commune: d.commune, address: d.address, ordersCount: 1, totalSpent: total })
        .onConflictDoUpdate({
          target: [customers.storeId, customers.phone],
          set: {
            name: d.name,
            wilayaCode: wilaya.code,
            commune: d.commune,
            address: d.address,
            ordersCount: sql`${customers.ordersCount} + 1`,
            totalSpent: sql`${customers.totalSpent} + ${total}`,
            updatedAt: new Date(),
          },
        })
        .returning({ id: customers.id });

      const [order] = await tx
        .insert(orders)
        .values({
          storeId: store.id,
          number: seq,
          customerId: customer.id,
          idempotencyKey: d.idempotencyKey,
          customerName: d.name,
          customerPhone: phone,
          wilayaCode: wilaya.code,
          commune: d.commune,
          address: d.address,
          deliveryType: d.deliveryType,
          items: [{ productId: product.id, name: product.name, price: product.price, qty: d.qty, variant: d.variant || null, image: product.images[0] ?? null }],
          subtotal,
          deliveryFee,
          total,
          ip,
          customerNote: d.note,
        })
        .returning({ id: orders.id });

      await tx.insert(orderEvents).values({ orderId: order.id, fromStatus: null, toStatus: "pending", note: "Commande reçue depuis la boutique." });
      if (product.stock !== null) {
        await tx.update(products).set({ stock: sql`GREATEST(${products.stock} - ${d.qty}, 0)` }).where(eq(products.id, product.id));
      }
      return order.id;
    });
  } catch (err) {
    // Unique violation on idempotency key under a race → resolve to existing order.
    const pgCode = (e: unknown): string | undefined => {
      if (typeof e !== "object" || !e) return undefined;
      const direct = (e as { code?: unknown }).code;
      if (typeof direct === "string") return direct;
      return pgCode((e as { cause?: unknown }).cause);
    };
    if (pgCode(err) === "23505") {
      const existing = await db.query.orders.findFirst({
        where: and(eq(orders.storeId, store.id), eq(orders.idempotencyKey, d.idempotencyKey)),
        columns: { id: true },
      });
      if (existing) redirect(`/${store.subdomain}/merci/${existing.id}`);
    }
    throw err;
  }

  revalidatePath("/dashboard", "layout");
  redirect(`/${store.subdomain}/merci/${orderId}`);
}

/* ---------------------------- merchant lifecycle --------------------------- */


export async function updateOrderStatusAction(orderId: string, to: string, note = ""): Promise<FormState> {
  const { store } = await requireStore();
  if (!(ORDER_STATUSES as readonly string[]).includes(to)) return { error: "Statut inconnu." };
  const target = to as OrderStatus;
  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.storeId, store.id)) });
  if (!order) return { error: "Commande introuvable." };
  if (!ORDER_TRANSITIONS[order.status].includes(target)) {
    return { error: `Transition ${order.status} → ${target} non autorisée.` };
  }
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status: target, updatedAt: new Date() }).where(eq(orders.id, orderId));
    await tx.insert(orderEvents).values({ orderId, fromStatus: order.status, toStatus: target, note: note.slice(0, 300) });
    // Restock on cancel / return.
    if ((target === "cancelled" || target === "returned") && order.status !== "cancelled") {
      for (const item of order.items) {
        await tx
          .update(products)
          .set({ stock: sql`CASE WHEN ${products.stock} IS NULL THEN NULL ELSE ${products.stock} + ${item.qty} END` })
          .where(eq(products.id, item.productId));
      }
    }
  });
  revalidatePath("/dashboard", "layout");
  return { success: "Statut mis à jour." };
}

export async function updateOrderNoteAction(orderId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { store } = await requireStore();
  const note = String(formData.get("internalNote") ?? "").slice(0, 1000);
  await db.update(orders).set({ internalNote: note, updatedAt: new Date() }).where(and(eq(orders.id, orderId), eq(orders.storeId, store.id)));
  revalidatePath(`/dashboard/orders/${orderId}`);
  return { success: "Note enregistrée." };
}
