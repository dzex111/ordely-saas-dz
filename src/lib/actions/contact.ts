"use server";

import { z } from "zod";
import { db } from "@/db";
import { contactRequests, PLAN_IDS, type PlanId } from "@/db/schema";
import { getCurrentStore } from "@/lib/auth";
import type { FormState } from "./auth";

/** Public contact form — plan upgrade requests. Stored for manual review by the admin.
 *  Nothing here ever changes a store plan; only the admin does that directly. */
export async function createContactRequestAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Votre nom est requis.").max(80),
      contact: z.string().trim().min(5, "Ajoutez un email ou un numéro de téléphone.").max(120),
      plan: z.string(),
      message: z.string().trim().max(1000).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const plan = (PLAN_IDS as readonly string[]).includes(parsed.data.plan)
    ? (parsed.data.plan as PlanId)
    : ("growth" as PlanId);

  const store = await getCurrentStore().catch(() => null);
  const message = parsed.data.message ?? "";
  await db.insert(contactRequests).values({
    storeId: store?.id ?? null,
    name: parsed.data.name,
    contact: parsed.data.contact,
    plan,
    message,
  });

  // Instant admin notification (best-effort — never blocks the form).
  await notifyAdminTelegram({
    name: parsed.data.name,
    contact: parsed.data.contact,
    plan,
    message,
    storeName: store?.name ?? null,
  }).catch(() => null);

  return { success: "Demande envoyée. L’admin vous contactera pour activer votre plan." };
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Public broadcast: every chat that started the bot receives new contact requests.
 *  No chat ID configuration needed — anyone who presses Start subscribes. */
async function notifyAdminTelegram(input: { name: string; contact: string; plan: PlanId; message: string; storeName: string | null }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  const text = [
    "<b>طلب تواصل جديد — ORDELY</b>",
    "",
    `<b>الاسم:</b> ${escapeHtml(input.name)}`,
    `<b>التواصل:</b> ${escapeHtml(input.contact)}`,
    `<b>الخطة المطلوبة:</b> ${escapeHtml(input.plan)}`,
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
