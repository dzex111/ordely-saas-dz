import Link from "next/link";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { Download, Search } from "lucide-react";
import { db } from "@/db";
import { orders, ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { STATUS_META } from "@/lib/commerce";
import { wilayaByCode, formatPhone } from "@/lib/algeria";
import { cn, formatDZD, formatDateTime } from "@/lib/utils";
import { EmptyState, PageHeader, StatusBadge } from "@/components/dashboard/ui";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { store } = await requireStore();
  const { status, q } = await searchParams;
  const activeStatus = (ORDER_STATUSES as readonly string[]).includes(status ?? "") ? (status as OrderStatus) : null;
  const where = and(
    eq(orders.storeId, store.id),
    activeStatus ? eq(orders.status, activeStatus) : undefined,
    q ? or(ilike(orders.customerName, `%${q}%`), ilike(orders.customerPhone, `%${q.replace(/\s/g, "")}%`)) : undefined,
  );
  const rows = await db.query.orders.findMany({ where, orderBy: [desc(orders.createdAt)], limit: 200 });

  return (
    <>
      <PageHeader title="Commandes" description="Confirmez par téléphone, expédiez, encaissez à la livraison." action={
        hasFeature(store.plan, "csvExport") ? (
          <a href="/api/dashboard/orders/export" className="db-btn-secondary">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        ) : undefined
      } />
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <Link href="/dashboard/orders" className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition", !activeStatus ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50")}>Toutes</Link>
          {ORDER_STATUSES.map((s) => (
            <Link key={s} href={`/dashboard/orders?status=${s}`} className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition", activeStatus === s ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50")}>{STATUS_META[s].label}</Link>
          ))}
        </div>
        <form className="relative">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input name="q" defaultValue={q ?? ""} placeholder="Nom ou téléphone…" className="db-input !pl-9 md:w-64" />
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={q || activeStatus ? "Aucune commande ne correspond" : "Aucune commande pour l’instant"} description={q || activeStatus ? "Essayez un autre filtre ou une autre recherche." : "Dès qu’un client commande sur votre boutique, elle apparaît ici avec son numéro de téléphone pour confirmation."} cta={!q && !activeStatus ? { href: "/dashboard/products", label: "Voir mes produits" } : undefined} />
      ) : (
        <div className="db-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">N°</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Produit</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Wilaya</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((o) => (
                <tr key={o.id} className="transition hover:bg-zinc-50">
                  <td className="px-4 py-3 font-semibold tabular-nums text-zinc-500"><Link href={`/dashboard/orders/${o.id}`}>#{String(o.number).padStart(4, "0")}</Link></td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/orders/${o.id}`} className="block font-medium">{o.customerName}</Link>
                    <span className="text-xs text-zinc-500">{formatPhone(o.customerPhone)}</span>
                  </td>
                  <td className="hidden max-w-[220px] truncate px-4 py-3 text-zinc-600 md:table-cell">{o.items.map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ")}</td>
                  <td className="hidden px-4 py-3 text-zinc-600 lg:table-cell">{wilayaByCode(o.wilayaCode)?.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatDZD(o.total)}</td>
                  <td className="hidden px-4 py-3 text-right text-xs text-zinc-500 md:table-cell">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
