import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000").split(":")[0];
const RESERVED = new Set(["www", "app", "api", "admin", "dashboard", "mail", "static"]);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function extractSubdomain(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const host = hostHeader.split(":")[0].toLowerCase();
  if (host === ROOT || host === `www.${ROOT}`) return null;
  // Vercel preview / IP hosts → no tenant
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  if (host.endsWith(`.${ROOT}`)) {
    const sub = host.slice(0, -(ROOT.length + 1));
    if (!sub || sub.includes(".") || RESERVED.has(sub)) return null;
    return sub;
  }
  return null;
}

function isPlatformHost(hostHeader: string | null): boolean {
  if (!hostHeader) return true;
  const host = hostHeader.split(":")[0].toLowerCase();
  return (
    host === ROOT ||
    host === `www.${ROOT}` ||
    host.endsWith(`.${ROOT}`) ||
    host.endsWith(".vercel.app") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host === "localhost"
  );
}

/* Merchant custom domains → subdomain via a minimal locked-down RPC (60s cache). */
const domainCache = new Map<string, { sub: string | null; at: number }>();

async function resolveCustomDomain(hostHeader: string | null): Promise<string | null> {
  if (!hostHeader || !SUPABASE_URL || !SUPABASE_ANON) return null;
  const host = hostHeader.split(":")[0].toLowerCase();
  const hit = domainCache.get(host);
  if (hit && Date.now() - hit.at < 60_000) return hit.sub;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/resolve_store_domain`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, "Content-Type": "application/json" },
      body: JSON.stringify({ hostname: host }),
    });
    const sub = (await res.json().catch(() => null)) as string | null;
    const clean = typeof sub === "string" && /^[a-z0-9-]{1,40}$/.test(sub) ? sub : null;
    domainCache.set(host, { sub: clean, at: Date.now() });
    return clean;
  } catch {
    return hit?.sub ?? null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostHeader = request.headers.get("host");
  let sub = extractSubdomain(hostHeader);

  /* ---------- Merchant custom domain → internal rewrite ---------- */
  if (!sub && !isPlatformHost(hostHeader) && !pathname.startsWith("/api/")) {
    sub = await resolveCustomDomain(hostHeader);
  }

  /* ---------- Multi-tenant storefront on subdomain → internal rewrite ---------- */
  if (sub && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = `/${sub}${pathname === "/" ? "" : pathname}`;
    const headers = new Headers(request.headers);
    headers.set("x-ordely-tenant", sub);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  /* ---------- Dashboard gate (cheap cookie check; RSC does the real auth) ---------- */
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
  let response = NextResponse.next({ request });

  let authenticated = Boolean(request.cookies.get("ordely_session")?.value);

  if (SUPABASE_URL && SUPABASE_ANON) {
    // Keep Supabase sessions fresh on every request (recommended @supabase/ssr pattern).
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authenticated = authenticated || Boolean(user);
  }

  if (isProtected && !authenticated) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};
