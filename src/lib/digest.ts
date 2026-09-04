import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, stores, users } from "@/db/schema";
import { digestAllowed, sendMail } from "@/lib/email";
import { rootDomain } from "@/lib/utils";

/* Pending-orders digest — deliberately FEW mails, Brevo-free-tier safe:
 * - only stores that actually have pending orders (silence otherwise)
 * - max 1 per store per day (digestAllowed / email_logs)
 * - global 50/day cap enforced inside sendMail()
 * Sent by the daily cron (/api/cron) right after the tracking sync.
 */

export function digestSubject(pending: number): string {
  return pending === 1
    ? "ORDELY — 1 commande attend votre confirmation"
    : `ORDELY — ${pending} commandes attendent votre confirmation`;
}

/** Minimal white template + black button — the ORDELY mail identity. */
export function digestHtml(pending: number, dashboardUrl: string): string {
  const cmd = pending === 1 ? "commande" : "commandes";
  const attend = pending === 1 ? "attend" : "attendent";
  return `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
<div style="padding:24px 12px">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">
    <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.3em;color:#71717a">ORDELY</p>
    <h1 style="margin:0 0 8px;font-size:20px;color:#18181b">${pending} ${cmd} ${attend} votre confirmation</h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b">
      Des commandes COD attendent votre confirmation dans votre tableau de bord.
      Confirmez-les pour lancer la livraison.
    </p>
    <a href="${dashboardUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px">Voir les commandes</a>
    <p style="margin:24px 0 0;font-size:11px;color:#a1a1aa">
      Vous recevez cet email au maximum une fois par jour, et uniquement s'il y a des commandes en attente.
    </p>
  </div>
</div>
</body></html>`;
}

/** Absolute dashboard URL, or null in dev (never mail a localhost link). */
function dashboardOrdersUrl(): string | null {
  const root = rootDomain();
  if (!root || root === "localhost:3000") return null;
  return `https://${root}/dashboard/orders`;
}

export async function sendPendingDigests(): Promise<{ checked: number; sent: number }> {
  const url = dashboardOrdersUrl();
  if (!url) return { checked: 0, sent: 0 };
  const rows = await db
    .select({ storeId: stores.id, ownerId: stores.ownerId, pending: count() })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .where(eq(orders.status, "pending"))
    .groupBy(stores.id, stores.ownerId);

  let sent = 0;
  for (const row of rows) {
    if (row.pending <= 0) continue; // defensive — GROUP BY only yields pending > 0
    if (!(await digestAllowed(row.storeId))) continue;
    const owner = await db.query.users.findFirst({ where: eq(users.id, row.ownerId), columns: { email: true } });
    if (!owner?.email) continue;
    const res = await sendMail({
      to: owner.email,
      subject: digestSubject(row.pending),
      html: digestHtml(row.pending, url),
      storeId: row.storeId,
      kind: "pending_digest",
    });
    if (res.ok) sent += 1;
  }
  return { checked: rows.length, sent };
}