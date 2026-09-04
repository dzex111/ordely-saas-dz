import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { denyUnless } from "@/lib/team";
import { formatDZD } from "@/lib/utils";
import { wilayaByCode } from "@/lib/algeria";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV export of all store orders (PRO+ feature, server-enforced). */
export async function GET() {
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
  const rows = await db.query.orders.findMany({
    where: eq(orders.storeId, store.id),
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
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ordely-commandes-${store.subdomain}.csv"`,
    },
  });
}
