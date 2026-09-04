import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { orders, ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { denyUnless } from "@/lib/team";
import { formatDZD } from "@/lib/utils";
import { wilayaByCode } from "@/lib/algeria";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV export — respects the dashboard filters (?status=&q=). PRO+ feature, server-enforced. */
export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireStore();
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { store, user } = ctx;
  if (!hasFeature(store.plan, "csvExport")) {
    return NextResponse.json({ ok: false, error: "Export CSV nécessite le plan PRO." }, { status: 403 });
  }
  if (await denyUnless(store, user, "manageOrders")) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const sp = req.nextUrl.searchParams;
  const rawStatus = sp.get("status") ?? "";
  const status = (ORDER_STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as OrderStatus) : null;
  const q = (sp.get("q") ?? "").trim().slice(0, 60);
  const rows = await db.query.orders.findMany({
    where: and(
      eq(orders.storeId, store.id),
      status ? eq(orders.status, status) : undefined,
      q ? or(ilike(orders.customerName, `%${q}%`), ilike(orders.customerPhone, `%${q.replace(/\s/g, "")}%`)) : undefined,
    ),
    orderBy: [desc(orders.createdAt)],
    limit: 5000,
  });
  const header = ["N°", "Date", "Statut", "Client", "Téléphone", "Wilaya", "Commune", "Adresse", "Livraison", "Articles", "Sous-total", "Frais", "Total"];
  const lines = rows.map((o) =>
    [
      String(o.number).padStart(4, "0"),
      o.createdAt.toISOString().slice(0, 16).replace("T", " "),
      o.status,
      o.customerName,
      o.customerPhone,
      wilayaByCode(o.wilayaCode)?.name ?? o.wilayaCode,
      o.commune,
      o.address,
      o.deliveryType,
      o.items.map((i) => `${i.name} x${i.qty}`).join(" | "),
      formatDZD(o.subtotal),
      formatDZD(o.deliveryFee),
      formatDZD(o.total),
    ]
      .map(cell)
      .join(";"),
  );
  const csv = "﻿" + [header.join(";"), ...lines].join("\n");
  const suffix = status ? `-${status}` : "";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ordely-commandes-${store.subdomain}${suffix}.csv"`,
    },
  });
}
