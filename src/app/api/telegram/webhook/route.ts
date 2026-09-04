import { NextRequest } from "next/server";
import { count, desc, eq, gte, and } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, stores, subscriptions, users, type PlanId } from "@/db/schema";
import { getPlan, startOfBillingMonth } from "@/lib/plans";
import { pushNotification } from "@/lib/actions/notifications";

/* Telegram Super-Admin — owner only. Merchants never see this.
 * Flow: admin pastes a merchant store ID (ORD-XXXXXX) → store card opens
 * with plan buttons. Currently plan change is the only action. */

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

async function storeCard(chatId: ChatId, storeId: string, messageId?: number) {
  const [s] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!s) return;
  const [pc, oc, owner, mc] = await Promise.all([
    db.select({ n: products.id }).from(products).where(eq(products.storeId, s.id)).limit(10000).then((r) => r.length),
    db.select({ n: orders.id }).from(orders).where(eq(orders.storeId, s.id)).limit(100000).then((r) => r.length),
    db.select({ email: users.email }).from(users).where(eq(users.id, s.ownerId)).limit(1).then((r) => r[0] ?? null),
    db.select({ value: count() }).from(orders).where(and(eq(orders.storeId, s.id), gte(orders.createdAt, startOfBillingMonth(new Date())))).then((r) => Number(r[0]?.value ?? 0)),
  ]);
  const limit = getPlan(s.plan).limits.ordersPerMonth;
  const text = [
    `<b>المتجر:</b> ${esc(s.name)}`,
    `<b>ID:</b> ${esc(s.publicId ?? "—")}`,
    `<b>الرابط:</b> ${esc(s.subdomain)}`,
    `<b>الخطة الحالية:</b> ${esc(getPlan(s.plan).name)} (${esc(s.planStatus)})`,
    `<b>طلبات الشهر:</b> ${mc}${limit !== null ? ` / ${limit}` : ""}`,
    `<b>المنتجات:</b> ${pc} | <b>الطلبات:</b> ${oc}`,
    `<b>المالك:</b> ${esc(owner?.email ?? s.ownerId)}`,
  ].join("\n");
  const markup = {
    inline_keyboard: [
      [btn("Starter", `plan:${s.id}:starter`), btn("PRO", `plan:${s.id}:pro`), btn("BUSINESS", `plan:${s.id}:business`)],
      [btn(s.suspended ? "فك التعليق" : "تعليق المتجر", `pub:${s.id}`), btn("حذف المتجر", `del:${s.id}`)],
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

  const cb = update.callback_query;
  if (cb?.data) {
    const [action, ...rest] = cb.data.split(":");
    await tg("answerCallbackQuery", { callback_query_id: cb.id }).catch(() => null);
    if (action === "plan") {
      const [id, plan] = rest as [string, PlanId];
      await db.update(stores).set({ plan, planStatus: "active", trialEndsAt: null, updatedAt: new Date() }).where(eq(stores.id, id));
      await db.insert(subscriptions).values({ storeId: id, plan, status: "active", provider: "manual", metadata: { source: "telegram-admin" } });
      await pushNotification({ storeId: id, type: "plan_changed", title: `Plan changé — ${plan}`, body: "Activé par l’admin. Votre boutique est à jour.", link: "/dashboard/billing" });
      await storeCard(chatId, id, cb.message?.message_id);
      await tg("sendMessage", { chat_id: chatId, text: `تم تغيير الاشتراك إلى <b>${esc(getPlan(plan).name)} — ${getPlan(plan).priceMonthly.toLocaleString("fr-FR")} DA/mois</b>.`, parse_mode: "HTML" });
      return;
    }
    if (action === "pulse") {
      const d = new Date();
      const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - 3600_000);
      const [allStores, todayOrders, pendingOrders, delivered] = await Promise.all([
        db.select({ id: stores.id }).from(stores).limit(100000),
        db.select({ id: orders.id }).from(orders).where(gte(orders.createdAt, dayStart)).limit(100000),
        db.select({ id: orders.id }).from(orders).where(eq(orders.status, "pending")).limit(100000),
        db.select({ total: orders.total }).from(orders).where(eq(orders.status, "delivered")).limit(1000000),
      ]);
      const revenue = delivered.reduce((sum, o) => sum + (o.total || 0), 0);
      await tg("sendMessage", {
        chat_id: chatId,
        text: [
          "<b>نبض المنصة</b>",
          "",
          `<b>المتاجر:</b> ${allStores.length}`,
          `<b>طلبات اليوم:</b> ${todayOrders.length}`,
          `<b>طلبات معلقة:</b> ${pendingOrders.length}`,
          `<b>إيراد المسلّمة:</b> ${revenue.toLocaleString("fr-FR")} DA`,
        ].join("\n"),
        parse_mode: "HTML",
      });
      return;
    }
    if (action === "pub") {
      const [s] = await db.select().from(stores).where(eq(stores.id, rest[0])).limit(1);
      if (s) {
        await db.update(stores).set({ suspended: !s.suspended, updatedAt: new Date() }).where(eq(stores.id, s.id));
        await pushNotification({
          storeId: s.id,
          type: s.suspended ? "unsuspended" : "suspended",
          title: s.suspended ? "Boutique réactivée" : "Boutique suspendue par l’admin",
          body: s.suspended ? "Votre boutique est de nouveau en ligne." : "Contactez l’admin via la page Contact pour régulariser la situation.",
          link: "/dashboard/settings",
        });
      }
      await storeCard(chatId, rest[0], cb.message?.message_id);
      const [updated] = await db.select().from(stores).where(eq(stores.id, rest[0])).limit(1);
      await tg("sendMessage", { chat_id: chatId, text: updated?.suspended ? "تم <b>تعليق</b> المتجر — لن يعود للعمل من الإعدادات." : "تم <b>فك التعليق</b> — المتجر يعمل.", parse_mode: "HTML" });
      return;
    }
    if (action === "del") {
      const [s] = await db.select().from(stores).where(eq(stores.id, rest[0])).limit(1);
      await tg("sendMessage", {
        chat_id: chatId,
        text: `تأكيد حذف <b>${esc(s?.name)}</b>؟ سيحذف المنتجات والطلبات والعملاء نهائياً ولا يمكن التراجع.`,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[btn("نعم، احذف نهائياً", `delyes:${rest[0]}`), btn("تراجع", `back:${rest[0]}`)]] },
      });
      return;
    }
    if (action === "back") {
      await storeCard(chatId, rest[0]);
      return;
    }
    if (action === "delyes") {
      const [s] = await db.select().from(stores).where(eq(stores.id, rest[0])).limit(1);
      await db.delete(stores).where(eq(stores.id, rest[0]));
      await tg("sendMessage", { chat_id: chatId, text: `تم حذف المتجر <b>${esc(s?.name)}</b> نهائياً.`, parse_mode: "HTML" });
      return;
    }
    return;
  }

  const text = (update.message?.text ?? "").trim().toUpperCase();
  if (text === "/START" || text === "/MENU") {
    await tg("sendMessage", {
      chat_id: chatId,
      text: "<b>لوحة تحكم ORDELY</b>\n\nأرسل <b>ID المتجر</b> (مثال: ORD-X7K2P9) لفتح قائمة التحكم فيه.",
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[btn("نبض المنصة", "pulse")]] },
    });
    return;
  }
  if (!text) return;
  const found = await db.query.stores.findMany({
    where: eq(stores.publicId, text),
    orderBy: [desc(stores.createdAt)],
    limit: 1,
  });
  if (!found.length) {
    await tg("sendMessage", { chat_id: chatId, text: `لا يوجد متجر بهذا الـ ID. تأكد منه وأعد الإرسال.` });
    return;
  }
  await storeCard(chatId, found[0].id);
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
