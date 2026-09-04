"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products, type ProductFeature, type ProductOption } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { getPlan, upgradeCta } from "@/lib/plans";
import { uploadImage } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import type { FormState } from "./auth";

const productSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court.").max(120),
  slug: z.string().trim().max(80).optional(),
  shortDescription: z.string().trim().max(200).default(""),
  description: z.string().trim().max(5000).default(""),
  price: z.coerce.number().int().min(0, "Prix invalide."),
  compareAtPrice: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
  stock: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
  status: z.enum(["draft", "active", "archived"]).default("active"),
  featured: z.string().optional(),
  images: z.string().default("[]"),
  features: z.string().default("[]"),
  options: z.string().default("[]"),
});

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function sanitize(data: z.infer<typeof productSchema>) {
  const images = parseJson<string[]>(data.images, []).filter((u) => typeof u === "string" && u.length < 1000).slice(0, 10);
  const features = parseJson<ProductFeature[]>(data.features, [])
    .filter((f) => f && typeof f.title === "string" && typeof f.text === "string" && f.title.trim())
    .map((f) => ({ title: f.title.trim().slice(0, 60), text: f.text.trim().slice(0, 200) }))
    .slice(0, 8);
  const options = parseJson<ProductOption[]>(data.options, [])
    .filter((o) => o && typeof o.name === "string" && Array.isArray(o.values) && o.name.trim())
    .map((o) => ({
      name: o.name.trim().slice(0, 40),
      values: o.values.map((v) => String(v).trim().slice(0, 40)).filter(Boolean).slice(0, 20),
    }))
    .filter((o) => o.values.length > 0)
    .slice(0, 3);
  return {
    name: data.name,
    shortDescription: data.shortDescription,
    description: data.description,
    price: data.price,
    compareAtPrice: data.compareAtPrice === "" || data.compareAtPrice === undefined ? null : data.compareAtPrice,
    stock: data.stock === "" || data.stock === undefined ? null : data.stock,
    status: data.status,
    featured: data.featured === "on",
    images,
    features,
    options,
  };
}

async function uniqueSlug(storeId: string, base: string, excludeId?: string) {
  const root = slugify(base) || "produit";
  let slug = root;
  for (let i = 2; i < 50; i++) {
    const clash = await db.query.products.findFirst({
      where: excludeId
        ? and(eq(products.storeId, storeId), eq(products.slug, slug), ne(products.id, excludeId))
        : and(eq(products.storeId, storeId), eq(products.slug, slug)),
      columns: { id: true },
    });
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

export async function createProductAction(_: FormState, formData: FormData): Promise<FormState> {
  const { store } = await requireStore();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const plan = getPlan(store.plan);
  // Downgrade-safe: existing products are preserved, only creation past the limit is blocked.
  const productLimit = plan.limits.productsPerStore;
  if (productLimit !== null) {
    const [{ value }] = await db.select({ value: count() }).from(products).where(eq(products.storeId, store.id));
    if (value >= productLimit) {
      const cta = upgradeCta(store.plan);
      return { error: `Vous avez atteint la limite de ${productLimit} produits du plan ${plan.name}.${cta ? ` ${cta}` : ""}` };
    }
  }

  const data = sanitize(parsed.data);
  const slug = await uniqueSlug(store.id, parsed.data.slug || data.name);
  const [row] = await db.insert(products).values({ ...data, storeId: store.id, slug }).returning({ id: products.id });
  revalidatePath(`/${store.subdomain}`, "layout");
  revalidatePath("/dashboard/products");
  redirect(`/dashboard/products/${row.id}?created=1`);
}

export async function updateProductAction(productId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { store } = await requireStore();
  const existing = await db.query.products.findFirst({ where: and(eq(products.id, productId), eq(products.storeId, store.id)) });
  if (!existing) return { error: "Produit introuvable." };
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = sanitize(parsed.data);
  const slug = await uniqueSlug(store.id, parsed.data.slug || data.name, productId);
  await db.update(products).set({ ...data, slug, updatedAt: new Date() }).where(eq(products.id, productId));
  revalidatePath(`/${store.subdomain}`, "layout");
  revalidatePath("/dashboard/products");
  return { success: "Produit enregistré et publié." };
}

export async function deleteProductAction(productId: string) {
  const { store } = await requireStore();
  await db.delete(products).where(and(eq(products.id, productId), eq(products.storeId, store.id)));
  revalidatePath(`/${store.subdomain}`, "layout");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function uploadImageAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  const { store } = await requireStore();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Aucun fichier." };
  return uploadImage(file, store.id);
}
