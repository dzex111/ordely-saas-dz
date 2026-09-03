import { cache } from "react";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, stores } from "@/db/schema";

/* --------------------------- storefront data access ------------------------- */

export const getStoreBySubdomain = cache(async (subdomain: string) => {
  if (!/^[a-z0-9-]{1,40}$/.test(subdomain)) return null;
  return (await db.query.stores.findFirst({ where: eq(stores.subdomain, subdomain) })) ?? null;
});

export const getActiveProducts = cache(async (storeId: string) => {
  return db.query.products.findMany({
    where: and(eq(products.storeId, storeId), eq(products.status, "active")),
    orderBy: [desc(products.featured), asc(products.sortOrder), desc(products.createdAt)],
  });
});

export const getActiveProductBySlug = cache(async (storeId: string, slug: string) => {
  return (
    (await db.query.products.findFirst({
      where: and(eq(products.storeId, storeId), eq(products.slug, slug), eq(products.status, "active")),
    })) ?? null
  );
});
