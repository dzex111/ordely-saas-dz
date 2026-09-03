import Link from "next/link";
import { and, count, desc, eq, gte, sql, sum } from "drizzle-orm";
import { ArrowUpRight, Package, Palette, Sparkles } from "lucide-react";
import { db } from "@/db";
import { orders, products, type OrderStatus } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { formatDZD, storeUrl, timeAgo } from "@/lib/utils";
import { wilayaByCode } from "@/lib/algeria";
import { PageHeader, StatusBadge } from "@/components/dashboard/ui";

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { store } = await requireStore();
  const { welcome } = await searchParams;
  const since = new Date(Date.now() - 30 * 86400_000);
  const since14 = new Date(Date.now() - 13 * 86400_000);
  since14.setHours(0, 0, 0, 0);

  const [byStatus, recent, [{ productCount }], daily, [{ delivered30 }]] = await Promise.all([
    db.select({ status: orders.status, n: count(), total: sum(orders.total) }).from(orders).where(eq(orders.storeId, store.id)).groupBy(orders.status),
    db.query.orders.findMany({ where: eq(orders.storeId, store.id), orderBy: [desc(orders.createdAt)], limit: 8 }),
    db.select({ productCount: count() }).from(products).where(eq(products.storeId, store.id)),
    db
      .select({ day: sql<string>`to_char(${orders.createdAt} AT TIME ZONE 'Africa/Algiers', 'YYYY-MM-DD')`, n: count(), total: sum(orders.total) })
      .from(orders)
      .where(and(eq(orders.storeId, store.id), gte(orders.createdAt, since14)))
      .groupBy(sql`1`),
    db.select({ delivered30: sum(orders.total) }).from(orders).where(and(eq(orders.storeId, store.id), eq(orders.status, "delivered"), gte(orders.updatedAt, since))),
  ]);

  const stat = (s: OrderStatus) => byStatus.find((r) => r.status === s);
  const totalOrders = byStatus.reduce((a, r) => a + r.n, 0);
  const deliveredN = stat("delivered")?.n ?? 0;
  const returnedN = stat("returned")?.n ?? 0;
  const closed = deliveredN + returnedN + (stat("cancelled")?.n ?? 0);
  const deliveryRate = closed > 0 ? Math.round((deliveredN / closed) * 100) : null;
  const pendingN = stat("pending")?.n ?? 0;
  const revenue = Number(stat("delivered")?.total ?? 0);
  const inFlight = ["pending", "confirmed", "shipped"].reduce((a, s) => a + Number(stat(s as OrderStatus)?.total ?? 0), 0);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since14.getTime() + i * 86400_000);
    const key = d.toISOString().slice(0, 10);
    const row = daily.find((r) => r.day === key);
    return { key, label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "Africa/Algiers" }), n: row?.n ?? 0, total: Number(row?.total ?? 0) };
  });
  const maxN = Math.max(1, ...days.map((d) => d.n));
  const now = new Date();

  return (
    <>
      {welcome && (
        <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-ink p-6 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-brand" /> Votre boutique est en ligne.</p>
            <p className="mt-1 text-sm text-white/60">Ouvrez-la, puis personnalisez couleurs, textes et produits — chaque changement est immédiat.</p>
          </div>
          <div className="flex gap-2">
            <a href={storeUrl(store.subdomain)} target="_blank" rel="noreferrer" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink">Ouvrir ma boutique</a>
            <Link href="/dashboard/customize" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium">Personnaliser</Link>
          </div>
        </div>
      )}
      <PageHeader title="Vue d’ensemble" description={`Bonjour. Voici ${store.name} aujourd’hui.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Chiffre d’affaires livré", value: formatDZD(revenue), sub: `${formatDZD(Number(delivered30 ?? 0))} sur 30 jours` },
          { label: "En cours (à encaisser)", value: formatDZD(inFlight), sub: `${totalOrders - closed} commandes actives` },
          { label: "À confirmer", value: String(pendingN), sub: pendingN > 0 ? "Appelez vos clients rapidement" : "Tout est confirmé", accent: pendingN > 0 },
          { label: "Taux de livraison", value: deliveryRate === null ? "—" : `${deliveryRate}%`, sub: `${deliveredN} livrées · ${returnedN} retours` },
        ].map((k) => (
          <div key={k.label} className="db-card p-5">
            <p className="text-xs font-medium text-zinc-500">{k.label}</p>
            <p className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${k.accent ? "text-amber-600" : ""}`}>{k.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="db-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Commandes · 14 derniers jours</p>
            <p className="text-xs text-zinc-500">{days.reduce((a, d) => a + d.n, 0)} commandes · {formatDZD(days.reduce((a, d) => a + d.total, 0))}</p>
          </div>
          <div className="mt-6 flex h-40 items-end gap-1.5">
            {days.map((d) => (
              <div key={d.key} className="group relative flex flex-1 flex-col items-center justify-end">
                <div className="w-full rounded-t-md bg-zinc-900 transition group-hover:bg-brand" style={{ height: `${Math.max(3, (d.n / maxN) * 100)}%`, opacity: d.n === 0 ? 0.12 : 1 }} />
                <span className="pointer-events-none absolute -top-8 hidden whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] text-white group-hover:block">{d.n} · {formatDZD(d.total)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
            <span>{days[0].label}</span><span>{days[6].label}</span><span>{days[13].label}</span>
          </div>
        </div>

        <div className="db-card p-5">
          <p className="text-sm font-semibold">Actions rapides</p>
          <div className="mt-4 space-y-2">
            {[
              { href: "/dashboard/products/new", icon: Package, t: "Ajouter un produit", d: `${productCount} produit${productCount > 1 ? "s" : ""} en catalogue` },
              { href: "/dashboard/customize", icon: Palette, t: "Personnaliser la boutique", d: "Template, couleurs, textes" },
              { href: "/dashboard/orders?status=pending", icon: ArrowUpRight, t: "Confirmer les commandes", d: `${pendingN} en attente d’appel` },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 transition hover:border-zinc-400 hover:bg-zinc-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100"><a.icon className="h-4 w-4" /></span>
                <span>
                  <span className="block text-sm font-medium">{a.t}</span>
                  <span className="block text-xs text-zinc-500">{a.d}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="db-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <p className="text-sm font-semibold">Dernières commandes</p>
          <Link href="/dashboard/orders" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">Tout voir →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium">Aucune commande pour l’instant.</p>
            <p className="mt-1 text-xs text-zinc-500">Partagez le lien de votre boutique : <a className="underline" href={storeUrl(store.subdomain)} target="_blank" rel="noreferrer">{storeUrl(store.subdomain)}</a></p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/dashboard/orders/${o.id}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-zinc-50">
                  <span className="w-14 text-xs font-semibold tabular-nums text-zinc-500">#{String(o.number).padStart(4, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{o.customerName}</span>
                    <span className="block truncate text-xs text-zinc-500">{o.items[0]?.name}{o.items[0]?.qty > 1 ? ` ×${o.items[0].qty}` : ""} · {wilayaByCode(o.wilayaCode)?.name}</span>
                  </span>
                  <StatusBadge status={o.status} />
                  <span className="w-24 text-right text-sm font-semibold tabular-nums">{formatDZD(o.total)}</span>
                  <span className="hidden w-24 text-right text-xs text-zinc-400 md:block">{timeAgo(o.createdAt, now)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
