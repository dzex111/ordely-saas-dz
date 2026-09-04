import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { computeRisk, type RiskResult } from "@/lib/risk";

type OrderLite = { id: string; customerPhone: string; wilayaCode: string };

const DECIDED = ["delivered", "cancelled", "returned"] as const;
const OPEN = ["pending", "confirmed", "shipped"] as const;

/** Per-order risk for a batch of same-store orders (3 aggregate queries total). */
export async function getStoreRiskMap(storeId: string, list: OrderLite[]): Promise<Map<string, RiskResult>> {
  const out = new Map<string, RiskResult>();
  if (!list.length) return out;
  const phones = [...new Set(list.map((o) => o.customerPhone))];
  const dayAgo = new Date(Date.now() - 86400_000);
  const window90 = new Date(Date.now() - 90 * 86400_000);

  const [byPhone, recent, wilayas] = await Promise.all([
    db
      .select({ phone: orders.customerPhone, status: orders.status, n: sql<number>`count(*)` })
      .from(orders)
      .where(and(eq(orders.storeId, storeId)))
      .groupBy(orders.customerPhone, orders.status),
    db
      .select({ phone: orders.customerPhone, n: sql<number>`count(*)` })
      .from(orders)
      .where(and(eq(orders.storeId, storeId), gte(orders.createdAt, dayAgo)))
      .groupBy(orders.customerPhone),
    db
      .select({ wilaya: orders.wilayaCode, status: orders.status, n: sql<number>`count(*)` })
      .from(orders)
      .where(gte(orders.createdAt, window90))
      .groupBy(orders.wilayaCode, orders.status),
  ]);

  const phoneStats = new Map<string, { decided: number; refused: number; delivered: number; open: number }>();
  for (const r of byPhone) {
    if (!phones.includes(r.phone)) continue;
    const s = phoneStats.get(r.phone) ?? { decided: 0, refused: 0, delivered: 0, open: 0 };
    const n = Number(r.n);
    if ((DECIDED as readonly string[]).includes(r.status)) s.decided += n;
    if (r.status === "cancelled" || r.status === "returned") s.refused += n;
    if (r.status === "delivered") s.delivered += n;
    if ((OPEN as readonly string[]).includes(r.status)) s.open += n;
    phoneStats.set(r.phone, s);
  }
  const recentMap = new Map(recent.filter((r) => phones.includes(r.phone)).map((r) => [r.phone, Number(r.n)] as const));

  const wilayaAgg = new Map<string, { decided: number; refused: number }>();
  for (const r of wilayas) {
    const s = wilayaAgg.get(r.wilaya) ?? { decided: 0, refused: 0 };
    const n = Number(r.n);
    if ((DECIDED as readonly string[]).includes(r.status)) s.decided += n;
    if (r.status === "cancelled" || r.status === "returned") s.refused += n;
    wilayaAgg.set(r.wilaya, s);
  }

  for (const o of list) {
    const ps = phoneStats.get(o.customerPhone) ?? { decided: 0, refused: 0, delivered: 0, open: 0 };
    const wa = wilayaAgg.get(o.wilayaCode);
    out.set(
      o.id,
      computeRisk({
        ...ps,
        last24h: recentMap.get(o.customerPhone) ?? 0,
        wilayaRate: wa && wa.decided > 0 ? wa.refused / wa.decided : 0,
      }),
    );
  }
  return out;
}
