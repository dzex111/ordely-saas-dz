import { NextRequest } from "next/server";
import { desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { contactRequests, orders, products, stores, subscriptions, users, type PlanId } from "@/db/schema";

/* Telegram Super-Admin — owner only. Merchants never see this.
 * Admins are gated by ADMIN_TELEGRAM_IDS. Any plain text = store search. */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const ADMINS = (process.env.ADMIN_TELEGRAM_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

type ChatId = number | string;

async function tg(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json().catch(() => null);
}

const esc = (s: unknown) =>
  String(s ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const btn = (text: string, callback_data: string) => ({ text, callback_data });

async function sendMenu(chatId: ChatId) {
  const open = await db.query.contactRequests.findMany({
    where: eq(contactRequests.status, "open"),
    limit: 1,
  });
  await tg("sendMessage", {
    chat_id: chatId,
    text: "<b>لوحة تحكم ORDELY — سوبر آدمن</b>\n\nأرسل اسم المتجر أو رابطه للبحث، أو اختر من القائمة.",
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [btn("آخر المتاجر", "latest"), btn(`الطلبات المفتوحة${open.length ? " (جديد)" : ""}`, "reqs")],
      ],
    },
  });
}

async function storeCard(chatId: ChatId, storeId: string, messageId?: number) {
  const [s] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!s) return;
  const [[pc], [oc], owner] = await Promise.all([
    db.select({ n: products.id }).from(products).where(eq(products.storeId, s.id)).limit(10000).then((r) => [{ n: r.length }]),
    db.select({ n: orders.id }).from(orders).where(eq(orders.storeId, s.id)).limit(100000).then((r) => [{ n: r.length }]),
    db.select({ email: users.email }).from(users).where(eq(users.id, s.ownerId)).limit(1).then((r) => r[0] ?? null),
  ]);
  const text = [
    `<b>المتجر:</b> ${esc(s.name)}`,
    `<b>الرابط:</b> ${esc(s.subdomain)}`,
    `<b>الخطة:</b> ${esc(s.plan)} (${esc(s.planStatus)})`,
    `<b>القالب:</b> ${esc(s.template)}`,
    `<b>منشور:</b> ${s.published ? "نعم" : "موقوف"}`,
    `<b>المنتجات:</b> ${pc.n} | <b>الطلبات:</b> ${oc.n}`,
    `<b>المالك:</b> ${esc(owner?.email ?? s.ownerId)}`,
  ].join("\n");
  const markup = {
    inline_keyboard: [
      [btn("Starter", `plan:${s.id}:starter`), btn("Growth", `plan:${s.id}:growth`), btn("Scale", `plan:${s.id}:scale`)],
      [btn(s.published ? "إيقاف النشر" : "تفعيل النشر", `pub:${s.id}`), btn("حذف المتجر", `del:${s.id}`)],
      [btn("رجوع", "latest")],
    ],
  };
  if (messageId) {
    await tg("editMessageText", { chat_id: chatId, message_id: messageId, text, parse_mode: "HTML", reply_markup: markup });
  } else {
    await tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", reply_markup: markup });
  }
}

async function handleUpdate(update: {
  message?: { chat: { id: ChatId }; text?: string };
  callback_query?: { id: string; message?: { chat: { id: ChatId }; message_id: number }; data?: string };
}) {
  const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
  if (chatId === undefined || !ADMINS.includes(String(chatId))) {
    if (chatId !== undefined) {
      await tg("sendMessage", { chat_id: chatId, text: "هذه الأداة خاصة بإدارة ORDELY فقط." });
    }
    return;
  }

  // Button presses
  const cb = update.callback_query;
  if (cb?.data) {
    const [action, ...rest] = cb.data.split(":");
    await tg("answerCallbackQuery", { callback_query_id: cb.id }).catch(() => null);
    const mid = cb.message?.message_id;

    if (action === "latest") {
      const latest = await db.query.stores.findMany({ orderBy: [desc(stores.createdAt)], limit: 5 });
      await tg("sendMessage", {
        chat_id: chatId,
        text: "<b>آخر المتاجر</b>",
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: latest.map((s) => [btn(`${s.name} (${s.plan})`, `store:${s.id}`)]) },
      });
      return;
    }
    if (action === "store") {
      await storeCard(chatId, rest[0], mid);
      return;
    }
    if (action === "plan") {
      const [id, plan] = rest as [string, PlanId];
      await db.update(stores).set({ plan, planStatus: "active", trialEndsAt: null, updatedAt: new Date() }).where(eq(stores.id, id));
      await db.insert(subscriptions).values({ storeId: id, plan, status: "active", provider: "manual", metadata: { source: "telegram-admin" } });
      await storeCard(chatId, id, mid);
      await tg("sendMessage", { chat_id: chatId, text: `تم تغيير الخطة إلى <b>${esc(plan)}</b>.`, parse_mode: "HTML" });
      return;
    }
    if (action === "pub") {
      const [s] = await db.select().from(stores).where(eq(stores.id, rest[0])).limit(1);
      if (s) await db.update(stores).set({ published: !s.published, updatedAt: new Date() }).where(eq(stores.id, s.id));
      await storeCard(chatId, rest[0], mid);
      return;
    }
    if (action === "del") {
      const [s] = await db.select().from(stores).where(eq(stores.id, rest[0])).limit(1);
      await tg("sendMessage", {
        chat_id: chatId,
        text: `تأكيد حذف <b>${esc(s?.name)}</b>؟ سيحذف المنتجات والطلبات والعملاء نهائياً ولا يمكن التراجع.`,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[btn("نعم، احذف نهائياً", `delyes:${rest[0]}`), btn("تراجع", `store:${rest[0]}`)]] },
      });
      return;
    }
    if (action === "delyes") {
      const [s] = await db.select().from(stores).where(eq(stores.id, rest[0])).limit(1);
      await db.delete(stores).where(eq(stores.id, rest[0]));
      await tg("sendMessage", { chat_id: chatId, text: `تم حذف المتجر <b>${esc(s?.name)}</b> نهائياً.`, parse_mode: "HTML" });
      return;
    }
    if (action === "reqs") {
      const list = await db.query.contactRequests.findMany({ where: eq(contactRequests.status, "open"), orderBy: [desc(contactRequests.createdAt)], limit: 8 });
      if (!list.length) {
        await tg("sendMessage", { chat_id: chatId, text: "لا توجد طلبات مفتوحة." });
        return;
      }
      await tg("sendMessage", {
        chat_id: chatId,
        text: "<b>طلبات التواصل المفتوحة</b>",
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: list.map((r) => [btn(`${r.source === "plan" ? "[اشتراك] " : ""}${r.name} — ${r.plan}`, `req:${r.id}`)]),
        },
      });
      return;
    }
    if (action === "req") {
      const [r] = await db.select().from(contactRequests).where(eq(contactRequests.id, rest[0])).limit(1);
      if (!r) return;
      await tg("sendMessage", {
        chat_id: chatId,
        text: [
          `<b>${r.source === "plan" ? "طلب اشتراك" : "رسالة تواصل"}</b> — ${esc(r.status)}`,
          `<b>الاسم:</b> ${esc(r.name)}`,
          `<b>التواصل:</b> ${esc(r.contact)}`,
          `<b>الخطة:</b> ${esc(r.plan)}`,
          `<b>الرسالة:</b> ${esc(r.message || "—")}`,
        ].join("\n"),
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[btn("تمت المعالجة", `reqdone:${r.id}`)]] },
      });
      return;
    }
    if (action === "reqdone") {
      await db.update(contactRequests).set({ status: "handled" }).where(eq(contactRequests.id, rest[0]));
      await tg("sendMessage", { chat_id: chatId, text: "تم تعليم الطلب كمعالَج." });
      return;
    }
    return;
  }

  // Plain text
  const text = update.message?.text?.trim() ?? "";
  if (text === "/start" || text === "/menu") {
    await sendMenu(chatId);
    return;
  }
  if (!text) return;
  const q = `%${text}%`;
  const found = await db.query.stores.findMany({
    where: or(ilike(stores.name, q), ilike(stores.subdomain, q)),
    orderBy: [desc(stores.createdAt)],
    limit: 8,
  });
  if (!found.length) {
    await tg("sendMessage", { chat_id: chatId, text: `لا يوجد متجر يطابق "${esc(text)}".` });
    return;
  }
  await tg("sendMessage", {
    chat_id: chatId,
    text: `<b>نتائج البحث (${found.length})</b>`,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: found.map((s) => [btn(`${s.name} (${s.plan})`, `store:${s.id}`)]) },
  });
}

export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get("secret") !== (process.env.TELEGRAM_WEBHOOK_SECRET ?? "")) {
    return Response.json({ ok: false }, { status: 401 });
  }
  try {
    await handleUpdate(await req.json());
  } catch (e) {
    console.error("telegram webhook", e);
  }
  return Response.json({ ok: true });
}
