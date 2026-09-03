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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sub = extractSubdomain(request.headers.get("host"));

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
