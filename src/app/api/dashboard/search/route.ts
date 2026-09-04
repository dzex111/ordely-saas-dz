import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders, products } from "@/db/schema";
import { getCurrentStore } from "@/lib/auth";

/** Global dashboard search: orders + products + customers of the merchant's store. */
export async function GET(req: NextRequest) {
  const store = await getCurrentStore().catch(() => null);
  if (!store) return NextResponse.json({ ok: false }, { status: 401 });
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ ok: true, orders: [], products: [], customers: [] });
  const like = `%${q}%`;
  const [o, p, c] = await Promise.all([
    db.query.orders.findMany({
      where: and(
        eq(orders.storeId, store.id),
        or(ilike(orders.customerName, like), ilike(orders.customerPhone, like.replace(/\s/g, ""))),
      ),
      orderBy: [desc(orders.createdAt)],
      limit: 5,
      columns: { id: true, number: true, customerName: true, customerPhone: true, total: true, status: true },
    }),
    db.query.products.findMany({
      where: and(eq(products.storeId, store.id), ilike(products.name, like)),
      orderBy: [desc(products.createdAt)],
      limit: 5,
      columns: { id: true, name: true, price: true, stock: true },
    }),
    db.query.customers.findMany({
      where: and(eq(customers.storeId, store.id), or(ilike(customers.name, like), ilike(customers.phone, like.replace(/\s/g, "")))),
      orderBy: [desc(customers.updatedAt)],
      limit: 5,
      columns: { id: true, name: true, phone: true, ordersCount: true },
    }),
  ]);
  return NextResponse.json({ ok: true, orders: o, products: p, customers: c });
}
