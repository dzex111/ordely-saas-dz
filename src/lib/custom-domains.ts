import { promises as dns } from "node:dns";

/* Custom domains (PRO+): merchant-owned hostnames mapped to their store.
 * Pure validation/normalization lives here (unit-tested); Vercel + DNS
 * wiring below is server-only. */

export function normalizeCustomDomain(raw: string): string {
  let s = (raw ?? "").trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").split("/")[0];
  s = s.replace(/:\d+$/, "").replace(/\.+$/, "");
  return s;
}

const HOST_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,}$/;

/** French error message, or null when the hostname is acceptable. */
export function validateCustomDomain(host: string, rootDomain: string): string | null {
  if (!host) return "Ajoutez votre nom de domaine (ex : boutique-monsite.dz).";
  if (host.length > 253) return "Nom de domaine trop long.";
  if (!HOST_RE.test(host)) return "Nom de domaine invalide.";
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host === "localhost") return "Les adresses IP ne sont pas acceptées.";
  if (host.endsWith(".vercel.app")) return "Les sous-domaines vercel.app ne peuvent pas être rattachés.";
  const root = rootDomain.split(":")[0].toLowerCase();
  if (host === root || host.endsWith(`.${root}`)) {
    return "Ce domaine appartient à ORDELY — utilisez votre sous-domaine gratuit.";
  }
  return null;
}

const VERCEL_CNAME = "cname.vercel-dns.com";
const VERCEL_APEX_IP = "76.76.21.21";

/** True when the hostname points to Vercel (CNAME or apex A record). */
export async function dnsPointsToVercel(host: string): Promise<boolean> {
  try {
    const cnames = await dns.resolveCname(host).catch(() => [] as string[]);
    if (cnames.some((c) => c.replace(/\.+$/, "").toLowerCase() === VERCEL_CNAME)) return true;
  } catch {
    // fall through to A check (apex domains)
  }
  try {
    const addrs = await dns.resolve4(host).catch(() => [] as string[]);
    if (addrs.includes(VERCEL_APEX_IP)) return true;
  } catch {
    // unresolvable
  }
  return false;
}

function vercelEnv() {
  const token = process.env.VERCEL_API_TOKEN ?? "";
  const teamId = process.env.VERCEL_TEAM_ID ?? "";
  const projectId = process.env.VERCEL_PROJECT_ID ?? "";
  return { token, teamId, projectId, ready: Boolean(token && teamId && projectId) };
}

export function vercelConfigured(): boolean {
  return vercelEnv().ready;
}

async function vercel(path: string, init?: RequestInit) {
  const { token, teamId } = vercelEnv();
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://api.vercel.com${path}${sep}teamId=${teamId}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null;
  return { res, data };
}

/** Attach a hostname to the Vercel project (idempotent — existing domains are fine). */
export async function vercelAddDomain(host: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = vercelEnv();
  if (!env.ready) return { ok: false, error: "Configuration Vercel manquante côté serveur." };
  try {
    const { res, data } = await vercel(`/v10/projects/${env.projectId}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: host }),
    });
    if (res.ok) return { ok: true };
    const code = data?.error?.code ?? "";
    if (code === "domain_already_in_use" || code === "domain_already_exists") return { ok: true };
    return { ok: false, error: data?.error?.message ?? `Vercel a refusé le domaine (${res.status}).` };
  } catch {
    return { ok: false, error: "Vercel injoignable. Réessayez dans un moment." };
  }
}

export async function vercelRemoveDomain(host: string): Promise<void> {
  const env = vercelEnv();
  if (!env.ready) return;
  try {
    await vercel(`/v9/projects/${env.projectId}/domains/${encodeURIComponent(host)}`, { method: "DELETE" });
  } catch {
    // best-effort cleanup
  }
}
