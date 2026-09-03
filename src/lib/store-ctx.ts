import { headers } from "next/headers";
import { getStoreBySubdomain } from "@/lib/store-data";
import { resolveTheme } from "@/lib/templates";

/** Resolves the tenant, theme and link base (empty on subdomain hosts, `/{sub}` on path fallback). */
export async function getStoreCtx(subdomain: string) {
  const store = await getStoreBySubdomain(subdomain);
  if (!store) return null;
  const h = await headers();
  const onSubdomain = h.get("x-ordely-tenant") === subdomain;
  const base = onSubdomain ? "" : `/${subdomain}`;
  return { store, theme: resolveTheme(store), base };
}
