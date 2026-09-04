import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

/* Store analytics — plain SQL aggregations, no AI.
 * confirmed = confirmed+shipped+delivered · refused = cancelled+returned. */

export type AnalyticsRow = {
  status: string;
  total: number;
  wilayaCode: string;
  items: { productId: string; name: string; price: number; qty: number }[];
};

export type StoreMetrics = {
  total: number;
  confirmed: number;
  refused: number;
  delivered: number;
  confirmRate: number | null;
  refuseRate: number | null;
  deliveryRate: number | null;
  revenue: number;
  aov: number | null;
  topProducts: { name: string; qty: number; revenue: number }[];
  topWilayas: { code: string; count: number; revenue: number }[];
};

const CONFIRMED = ["confirmed", "shipped", "delivered"];
const REFUSED = ["cancelled", "returned"];

export function computeMetrics(rows: AnalyticsRow[]): StoreMetrics {
  let confirmed = 0;
  let refused = 0;
  let delivered = 0;
  let revenue = 0;
  const products = new Map<string, { name: string; qty: number; revenue: number }>();
  const wilayas = new Map<string, { code: string; count: number; revenue: number }>();

  for (const o of rows) {
    if (CONFIRMED.includes(o.status)) confirmed++;
    if (REFUSED.includes(o.status)) refused++;
    if (o.status === "delivered") {
      delivered++;
      revenue += o.total;
    }
    for (const it of o.items ?? []) {
      const p = products.get(it.productId) ?? { name: it.name, qty: 0, revenue: 0 };
      p.qty += it.qty;
      p.revenue += it.price * it.qty;
      products.set(it.productId, p);
    }
    const w = wilayas.get(o.wilayaCode) ?? { code: o.wilayaCode, count: 0, revenue: 0 };
    w.count++;
    if (o.status === "delivered") w.revenue += o.total;
    wilayas.set(o.wilayaCode, w);
  }

  const total = rows.length;
  const closed = delivered + rows.filter((o) => o.status === "cancelled" || o.status === "returned").length;
  return {
    total,
    confirmed,
    refused,
    delivered,
    confirmRate: total > 0 ? Math.round((confirmed / total) * 100) : null,
    refuseRate: total > 0 ? Math.round((refused / total) * 100) : null,
    deliveryRate: closed > 0 ? Math.round((delivered / closed) * 100) : null,
    revenue,
    aov: delivered > 0 ? Math.round(revenue / delivered) : null,
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    topWilayas: [...wilayas.values()].sort((a, b) => b.count - a.count).slice(0, 5),
  };
}

export async function getStoreAnalytics(storeId: string, from: Date | null): Promise<StoreMetrics> {
  const rows = await db.query.orders.findMany({
    where: and(eq(orders.storeId, storeId), from ? gte(orders.createdAt, from) : undefined),
    orderBy: [desc(orders.createdAt)],
    limit: 5000,
    columns: { status: true, total: true, wilayaCode: true, items: true },
  });
  return computeMetrics(rows as AnalyticsRow[]);
}
