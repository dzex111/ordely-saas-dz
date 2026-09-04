"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products, stores, subscriptions, type BrandOverrides, type StoreContent, type StoreSettings } from "@/db/schema";
import { getOwnedStore, requireStore, requireUser } from "@/lib/auth";
import { getTemplate, TEMPLATE_IDS } from "@/lib/templates";
import { getPlan, upgradeCta } from "@/lib/plans";
import { generateStorePublicId } from "@/lib/store-id";
import { denyUnless } from "@/lib/team";
import { isValidSubdomain, slugify } from "@/lib/utils";
import { WILAYAS } from "@/lib/algeria";
import type { FormState } from "./auth";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal(""));

function revalidateStore(subdomain: string) {
  revalidatePath(`/${subdomain}`, "layout");
  revalidatePath("/dashboard", "layout");
}

/* ------------------------------- onboarding -------------------------------- */

export async function createStoreAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  // No owned-store redirect here: owners may add a 2nd/3rd store.
  // The entitlement check below enforces the plan limit server-side.

  const parsed = z
    .object({
      name: z.string().trim().min(2, "Nom de boutique trop court.").max(60),
      subdomain: z.string().trim().toLowerCase(),
      template: z.string(),
      seed: z.string().optional(),
      phone: z.string().trim().optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, subdomain, template, seed, phone } = parsed.data;

  if (!isValidSubdomain(subdomain)) return { error: "Sous-domaine invalide : 3–32 caractères, lettres, chiffres et tirets." };
  if (!TEMPLATE_IDS.includes(template)) return { error: "Template inconnu." };
  const taken = await db.query.stores.findFirst({ where: eq(stores.subdomain, subdomain) });
  if (taken) return { error: "Ce sous-domaine est déjà pris." };

  const tpl = getTemplate(template);
  // Store entitlement: the merchant's allowance is the best plan across owned stores
  // (Starter = 1 boutique forever, BUSINESS = 3). Extras are blocked, never deleted.
  const owned = await db.query.stores.findMany({ where: eq(stores.ownerId, user.id), columns: { plan: true } });
  const allowance =
    owned.length === 0
      ? getPlan("starter").limits.stores
      : Math.max(...owned.map((o) => getPlan(o.plan).limits.stores));
  if (owned.length >= allowance) {
    const best = owned.length === 0 ? "starter" : owned.map((o) => o.plan).sort((a, b) => getPlan(b).priceMonthly - getPlan(a).priceMonthly)[0];
    const cta = upgradeCta(best);
    return { error: `Limite de ${allowance} boutique${allowance > 1 ? "s" : ""} atteinte.${cta ? ` ${cta}` : ""}` };
  }
  let publicId = generateStorePublicId();
  for (let i = 0; i < 5; i++) {
    const clash = await db.query.stores.findFirst({ where: eq(stores.publicId, publicId) });
    if (!clash) break;
    publicId = generateStorePublicId();
  }
  const [store] = await db
    .insert(stores)
    .values({
      ownerId: user.id,
      publicId,
      name,
      subdomain,
      template,
      vertical: tpl.vertical,
      tagline: tpl.tagline,
      content: { phone: phone || undefined, whatsapp: phone || undefined },
      // Starter is NOT a trial: no expiration, no card, no time limit.
      trialEndsAt: null,
    })
    .returning();

  if (seed === "on") {
    await db.insert(products).values(
      tpl.sampleProducts.map((p, i) => ({
        storeId: store.id,
        name: p.name,
        slug: slugify(p.name),
        shortDescription: p.short,
        description: `${p.short}\n\nLivraison partout en Algérie, paiement à la réception. Vous pouvez vérifier le produit avant de payer le livreur.`,
        price: p.price,
        compareAtPrice: p.compareAt ?? null,
        images: [p.image],
        features: p.features,
        options: p.options ?? [],
        featured: i === 0,
        sortOrder: i,
      })),
    );
  }

  await db.insert(subscriptions).values({ storeId: store.id, plan: "starter", status: "active", provider: "manual" });
  redirect("/dashboard?welcome=1");
}

/* -------------------------------- customize -------------------------------- */

export async function changeTemplateAction(templateId: string) {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageAppearance");
  if (denied) return { error: denied };
  if (!TEMPLATE_IDS.includes(templateId)) return { error: "Template inconnu." };
  const tpl = getTemplate(templateId);
  await db
    .update(stores)
    .set({ template: templateId, vertical: tpl.vertical, brand: {}, updatedAt: new Date() })
    .where(eq(stores.id, store.id));
  revalidateStore(store.subdomain);
  return { success: `Template ${tpl.name} appliqué.` };
}

export async function updateBrandAction(_: FormState, formData: FormData): Promise<FormState> {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageAppearance");
  if (denied) return { error: denied };
  const parsed = z
    .object({
      primary: hex,
      accent: hex,
      bg: hex,
      fg: hex,
      headingFont: z.string().optional(),
      bodyFont: z.string().optional(),
      radius: z.string().regex(/^\d{1,2}$/).optional().or(z.literal("")),
      logoUrl: z.string().optional(),
      name: z.string().trim().min(2).max(60),
      tagline: z.string().trim().max(120).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Vérifiez les couleurs (format #RRGGBB) et les champs." };
  const d = parsed.data;
  const brand: BrandOverrides = {};
  if (d.primary) brand.primary = d.primary;
  if (d.accent) brand.accent = d.accent;
  if (d.bg) brand.bg = d.bg;
  if (d.fg) brand.fg = d.fg;
  if (d.headingFont) brand.headingFont = d.headingFont;
  if (d.bodyFont) brand.bodyFont = d.bodyFont;
  if (d.radius) brand.radius = `${d.radius}px`;
  await db
    .update(stores)
    .set({ brand, name: d.name, tagline: d.tagline ?? "", logoUrl: d.logoUrl || null, updatedAt: new Date() })
    .where(eq(stores.id, store.id));
  revalidateStore(store.subdomain);
  return { success: "Identité enregistrée. Votre boutique est à jour." };
}

export async function resetBrandAction() {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageAppearance");
  if (denied) return { error: denied };
  await db.update(stores).set({ brand: {}, updatedAt: new Date() }).where(eq(stores.id, store.id));
  revalidateStore(store.subdomain);
}

export async function updateContentAction(_: FormState, formData: FormData): Promise<FormState> {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageAppearance");
  if (denied) return { error: denied };
  const str = (k: string, max = 600) => {
    const v = formData.get(k);
    return typeof v === "string" ? v.trim().slice(0, max) : "";
  };
  const trust = str("trustItems", 400)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  const content: StoreContent = {
    announcement: str("announcement", 140),
    heroEyebrow: str("heroEyebrow", 80),
    heroHeadline: str("heroHeadline", 140),
    heroSub: str("heroSub", 300),
    heroCta: str("heroCta", 40),
    heroImage: str("heroImage", 500),
    aboutTitle: str("aboutTitle", 80),
    aboutText: str("aboutText", 1200),
    trustItems: trust,
    phone: str("phone", 20),
    whatsapp: str("whatsapp", 20),
    instagram: str("instagram", 80),
    facebook: str("facebook", 120),
    tiktok: str("tiktok", 80),
    email: str("email", 120),
    footerNote: str("footerNote", 200),
  };
  await db.update(stores).set({ content, updatedAt: new Date() }).where(eq(stores.id, store.id));
  revalidateStore(store.subdomain);
  return { success: "Contenu publié sur la boutique." };
}

/* -------------------------------- settings --------------------------------- */

export async function updateSettingsAction(_: FormState, formData: FormData): Promise<FormState> {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageSettings");
  if (denied) return { error: denied };
  const num = (k: string) => {
    const v = Number(formData.get(k));
    return Number.isFinite(v) && v >= 0 ? Math.round(v) : NaN;
  };
  const home = num("homeDeliveryFee");
  const desk = num("deskDeliveryFee");
  const freeRaw = String(formData.get("freeShippingThreshold") ?? "").trim();
  const free = freeRaw === "" ? null : num("freeShippingThreshold");
  const returnDays = num("returnDays");
  const maxQtyRaw = num("maxQtyPerOrder");
  const maxQtyPerOrder = Number.isNaN(maxQtyRaw) ? 5 : Math.min(20, Math.max(1, maxQtyRaw));
  const language = formData.get("language") === "ar" ? "ar" : "fr";
  const published = formData.get("published") === "on";
  if ([home, desk, returnDays].some(Number.isNaN) || (free !== null && Number.isNaN(free))) {
    return { error: "Les montants doivent être des nombres positifs." };
  }

  const rateOverrides: StoreSettings["rateOverrides"] = {};
  for (const w of WILAYAS) {
    const h = String(formData.get(`rate_home_${w.code}`) ?? "").trim();
    const d = String(formData.get(`rate_desk_${w.code}`) ?? "").trim();
    if (h !== "" || d !== "") {
      const hv = h === "" ? home : Math.round(Number(h));
      const dv = d === "" ? desk : Math.round(Number(d));
      if (Number.isFinite(hv) && Number.isFinite(dv) && hv >= 0 && dv >= 0) rateOverrides[w.code] = { home: hv, desk: dv };
    }
  }

  const settings: StoreSettings = {
    currency: "DZD",
    language,
    homeDeliveryFee: home,
    deskDeliveryFee: desk,
    freeShippingThreshold: free,
    rateOverrides,
    returnDays,
    maxQtyPerOrder,
    checkoutNote: String(formData.get("checkoutNote") ?? "").trim().slice(0, 200),
  };

  const newSub = String(formData.get("subdomain") ?? store.subdomain).trim().toLowerCase();
  if (newSub !== store.subdomain) {
    if (!isValidSubdomain(newSub)) return { error: "Sous-domaine invalide." };
    const taken = await db.query.stores.findFirst({ where: and(eq(stores.subdomain, newSub), ne(stores.id, store.id)) });
    if (taken) return { error: "Ce sous-domaine est déjà pris." };
  }

  await db
    .update(stores)
    .set({ settings, published, subdomain: newSub, updatedAt: new Date() })
    .where(eq(stores.id, store.id));
  revalidateStore(store.subdomain);
  if (newSub !== store.subdomain) revalidateStore(newSub);
  return { success: "Paramètres enregistrés." };
}
