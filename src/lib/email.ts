import nodemailer from "nodemailer";
import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";

/* Brevo SMTP transactional mail — FEW and quota-safe by design:
 * - global cap 50/day (well under Brevo's free 300/day)
 * - 1 digest per store per day, 1 welcome per store ever
 * - every send is logged in email_logs (audit trail)
 */

const DAILY_GLOBAL_CAP = 50;

function configured(): boolean {
  return Boolean(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS);
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST ?? "smtp-relay.brevo.com",
    port: Number(process.env.BREVO_SMTP_PORT ?? 587),
    auth: { user: process.env.BREVO_SMTP_USER, pass: process.env.BREVO_SMTP_PASS },
  });
}

async function sentToday(kind?: string, storeId?: string): Promise<number> {
  const dayAgo = new Date(Date.now() - 86400_000);
  const rows = await db
    .select({ value: count() })
    .from(emailLogs)
    .where(
      and(
        gte(emailLogs.createdAt, dayAgo),
        kind ? eq(emailLogs.kind, kind) : undefined,
        storeId ? eq(emailLogs.storeId, storeId) : undefined,
      ),
    );
  return Number(rows[0]?.value ?? 0);
}

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  storeId?: string | null;
  kind: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!configured()) return { ok: false, error: "email not configured" };
  if ((await sentToday()) >= DAILY_GLOBAL_CAP) return { ok: false, error: "daily email cap reached" };
  try {
    await transporter().sendMail({
      from: process.env.BREVO_FROM ?? `"ORDELY" <${process.env.BREVO_SMTP_USER}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    await db.insert(emailLogs).values({ storeId: input.storeId ?? null, kind: input.kind, recipient: input.to });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : "send failed" };
  }
}

/** True when this store may receive another digest today (max 1/day). */
export async function digestAllowed(storeId: string): Promise<boolean> {
  return (await sentToday("pending_digest", storeId)) === 0;
}

/** True when this store never got its welcome mail. */
export async function welcomeNeeded(storeId: string): Promise<boolean> {
  return (await sentToday("welcome", storeId)) === 0;
}
