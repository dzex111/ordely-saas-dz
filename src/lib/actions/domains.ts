"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { denyUnless } from "@/lib/team";
import {
  dnsPointsToVercel,
  normalizeCustomDomain,
  validateCustomDomain,
  vercelAddDomain,
  vercelRemoveDomain,
} from "@/lib/custom-domains";
import type { FormState } from "./auth";

function rootDomain() {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
}

async function guard() {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageSettings");
  if (denied) return { denied } as const;
  if (!hasFeature(store.plan, "customDomain")) {
    return { denied: "Le domaine personnalisé nécessite le plan PRO." } as const;
  }
  return { store } as const;
}

/** Save + wire a merchant-owned hostname (3-click flow, admin-free). */
export async function saveCustomDomainAction(_: FormState, formData: FormData): Promise<FormState> {
  const g = await guard();
  if ("denied" in g) return { error: g.denied };
  const { store } = g;

  const parsed = z.object({ domain: z.string().trim().max(253) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Nom de domaine invalide." };
  const host = normalizeCustomDomain(parsed.data.domain);
  const invalid = validateCustomDomain(host, rootDomain());
  if (invalid) return { error: invalid };

  const taken = await db.query.stores.findFirst({
    where: and(eq(stores.customDomain, host), ne(stores.id, store.id)),
    columns: { id: true },
  });
  if (taken) return { error: "Ce domaine est déjà rattaché à une autre boutique." };

  const dnsOk = await dnsPointsToVercel(host);
  const added = await vercelAddDomain(host);
  if (!added.ok) return { error: added.error };

  await db
    .update(stores)
    .set({ customDomain: host, customDomainStatus: dnsOk ? "active" : "pending", updatedAt: new Date() })
    .where(eq(stores.id, store.id));
  revalidatePath("/dashboard/settings");
  return dnsOk
    ? { success: `${host} est actif. Votre boutique répond déjà dessus.` }
    : {
        info: `${host} est enregistré. Pointez-le vers Vercel puis cliquez sur « Vérifier » : CNAME → cname.vercel-dns.com (ou A → 76.76.21.21 pour un domaine racine).`,
      };
}

/** Re-check DNS (and Vercel wiring) for a pending domain. */
export async function verifyCustomDomainAction(): Promise<FormState> {
  const g = await guard();
  if ("denied" in g) return { error: g.denied };
  const { store } = g;
  if (!store.customDomain) return { error: "Aucun domaine à vérifier." };
  const dnsOk = await dnsPointsToVercel(store.customDomain);
  if (!dnsOk) {
    return {
      error: "Le domaine ne pointe pas encore vers Vercel. Ajoutez : CNAME → cname.vercel-dns.com (ou A → 76.76.21.21), attendez quelques minutes puis réessayez.",
    };
  }
  const added = await vercelAddDomain(store.customDomain);
  if (!added.ok) return { error: added.error };
  await db.update(stores).set({ customDomainStatus: "active", updatedAt: new Date() }).where(eq(stores.id, store.id));
  revalidatePath("/dashboard/settings");
  return { success: `${store.customDomain} est actif.` };
}

/** Detach a domain (Vercel cleanup is best-effort). */
export async function removeCustomDomainAction(): Promise<FormState> {
  const g = await guard();
  if ("denied" in g) return { error: g.denied };
  const { store } = g;
  if (store.customDomain) await vercelRemoveDomain(store.customDomain);
  await db
    .update(stores)
    .set({ customDomain: null, customDomainStatus: "none", updatedAt: new Date() })
    .where(eq(stores.id, store.id));
  revalidatePath("/dashboard/settings");
  return { success: "Domaine détaché." };
}
