export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(amount) + " DA";
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatDate(d: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Algiers",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(date);
}

export function formatDateTime(d: Date | string) {
  return formatDate(d, { hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(d: Date | string, now: Date = new Date()) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Math.max(0, now.getTime() - date.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l’instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `il y a ${days} j`;
  return formatDate(date);
}

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "login",
  "signup",
  "onboarding",
  "logout",
  "mail",
  "static",
  "assets",
  "_next",
  "ordely",
  "help",
  "docs",
  "billing",
  "status",
  "pricing",
  "templates",
]);

export function isValidSubdomain(s: string) {
  return /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(s) && !RESERVED_SUBDOMAINS.has(s);
}

export function rootDomain() {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
}

/** Public URL of a store. Uses subdomains in production, path fallback in dev. */
export function storeUrl(subdomain: string, path = "") {
  const root = rootDomain();
  const useSubdomains = process.env.NEXT_PUBLIC_USE_SUBDOMAINS === "true";
  if (useSubdomains) {
    const proto = root.startsWith("localhost") ? "http" : "https";
    return `${proto}://${subdomain}.${root}${path}`;
  }
  return `/${subdomain}${path}`;
}

/** Path-based link inside a storefront; stays relative so it works on both hosts. */
export function storePath(subdomain: string, path = "", onSubdomainHost = false) {
  return onSubdomainHost ? path || "/" : `/${subdomain}${path}`;
}
