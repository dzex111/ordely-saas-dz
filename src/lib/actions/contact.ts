"use server";

import { z } from "zod";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { contactRequests, PLAN_IDS, type PlanId } from "@/db/schema";
import { getPlan } from "@/lib/plans";
import { getCurrentStore } from "@/lib/auth";
import { clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import type { FormState } from "./auth";

/** Public contact form — plan upgrade requests. Stored for manual review by the admin.
 *  Nothing here ever changes a store plan; only the admin does that directly. */
export async function createContactRequestAction(_: FormState, formData: FormData): Promise<FormState> {
  // Honeypot: bots fill it, humans never see it. Fake success, store nothing.
  if (typeof formData.get("website") === "string" && (formData.get("website") as string).trim() !== "") {
    return { success: "Demande envoyée. L’admin vous contactera pour activer votre plan." };
  }
  if (!(await verifyTurnstile(formData.get("cf-turnstile-response") as string | null))) {
    return { error: "Vérification anti-robot échouée. Réessayez." };
  }
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Votre nom est requis.").max(80),
      contact: z.string().trim().min(5, "Ajoutez un email ou un numéro de téléphone.").max(120),
      plan: z.string(),
      message: z.string().trim().max(1000).optional(),
      source: z.string().optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const plan = (PLAN_IDS as readonly string[]).includes(parsed.data.plan)
    ? (parsed.data.plan as PlanId)
    : ("pro" as PlanId);
  const source = parsed.data.source === "plan" ? "plan" : "contact";

  const store = await getCurrentStore().catch(() => null);
  const message = parsed.data.message ?? "";

  // 3 requests / hour / IP — protects the free Brevo + Supabase quotas.
  const ip = await clientIp();
  const hourAgo = new Date(Date.now() - 3600_000);
  const recent = await db.query.contactRequests.findMany({
    where: and(eq(contactRequests.ip, ip), gte(contactRequests.createdAt, hourAgo)),
    columns: { id: true },
    limit: 3,
  });
  if (recent.length >= 3) return { error: "Trop de demandes. Réessayez dans une heure." };

  await db.insert(contactRequests).values({
    storeId: store?.id ?? null,
    name: parsed.data.name,
    contact: parsed.data.contact,
    plan,
    message,
    source,
    ip,
  });

  // Instant admin notification (best-effort — never blocks the form).
  await notifyAdminTelegram({
    name: parsed.data.name,
    contact: parsed.data.contact,
    plan,
    message,
    storeName: store?.name ?? null,
    source,
  }).catch(() => null);

  return { success: "Demande envoyée. L’admin vous contactera pour activer votre plan." };
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Public broadcast: every chat that started the bot receives new contact requests.
 *  No chat ID configuration needed — anyone who presses Start subscribes. */
async function notifyAdminTelegram(input: { name: string; contact: string; plan: PlanId; message: string; storeName: string | null; source: string }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  const isPlan = input.source === "plan";
  const planLabel = isPlan
    ? `${getPlan(input.plan).name} — ${getPlan(input.plan).priceMonthly.toLocaleString("fr-FR")} DA / mois`
    : null;
  const text = [
    `<b>${isPlan ? "طلب اشتراك — تغيير خطة" : "رسالة تواصل عامة"} — ORDELY</b>`,
    "",
    `<b>النوع:</b> ${isPlan ? "زر تغيير الخطة (اشتراك مدفوع)" : "نموذج التواصل (رسالة عادية)"}`,
    ...(planLabel ? [`<b>الخطة المطلوبة:</b> ${escapeHtml(planLabel)}`] : []),
    `<b>الاسم:</b> ${escapeHtml(input.name)}`,
    `<b>التواصل:</b> ${escapeHtml(input.contact)}`,
    `<b>المتجر:</b> ${escapeHtml(input.storeName ?? "—")}`,
    input.message ? `<b>الرسالة:</b> ${escapeHtml(input.message)}` : "<b>الرسالة:</b> —",
  ].join("\n");

  const chatIds = new Set<string>();
  try {
    const updates = (await (
      await fetch(`https://api.telegram.org/bot${token}/getUpdates`)
    ).json()) as { result?: Array<{ message?: { chat?: { id?: number | string } } }> };
    for (const u of updates.result ?? []) {
      const id = u.message?.chat?.id;
      if (id !== undefined) chatIds.add(String(id));
    }
  } catch {
    // fall through to optional fixed chat
  }
  if (process.env.TELEGRAM_CHAT_ID) chatIds.add(process.env.TELEGRAM_CHAT_ID);
  if (chatIds.size === 0) return;

  await Promise.allSettled(
    [...chatIds].map((chat_id) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text, parse_mode: "HTML" }),
      }),
    ),
  );
}
