import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Lock } from "lucide-react";
import { getAccessibleStores, requireStore } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { getStoreAnalytics, type StoreMetrics } from "@/lib/analytics";
import { formatDZD } from "@/lib/utils";
import { wilayaByCode } from "@/lib/algeria";
import { PageHeader } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const PERIODS = [
  { id: "7", label: "7 jours", days: 7 },
  { id: "30", label: "30 jours", days: 30 },
  { id: "90", label: "90 jours", days: 90 },
  { id: "all", label: "Tout", days: null },
] as const;

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="db-card p-5">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

function pct(v: number | null) {
  return v === null ? "—" : `${v}%`;
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { store } = await requireStore();
  if (!hasFeature(store.plan, "advancedAnalytics")) {
    return (
      <>
        <PageHeader title="Analytique" description="Comprendre ce qui se vend, où, et à quel taux." />
        <div className="db-card mx-auto max-w-md p-8 text-center">
          <Lock className="mx-auto h-6 w-6 text-zinc-400" />
          <p className="mt-3 font-semibold">Disponible sur PRO</p>
          <p className="mt-1 text-sm text-zinc-500">Taux de confirmation, top produits, top wilayas et comparaison entre boutiques.</p>
          <Link href="/dashboard/billing" className="db-btn mt-5 w-full">Voir les plans</Link>
        </div>
      </>
    );
  }

  const { period } = await searchParams;
  const active = PERIODS.find((p) => p.id === period) ?? PERIODS[1];
  const from = active.days ? new Date(Date.now() - active.days * 86400_000) : null;
  const m = await getStoreAnalytics(store.id, from);

  const accessible = await getAccessibleStores();
  const showCompare = hasFeature(store.plan, "multiStore") && accessible.length > 1;
  const compared: { name: string; m: StoreMetrics }[] = showCompare
    ? await Promise.all(accessible.slice(0, 4).map(async (a) => ({ name: a.store.name, m: await getStoreAnalytics(a.store.id, from) })))
    : [];

  return (
    <>
      <PageHeader
        title="Analytique"
        description="Comprendre ce qui se vend, où, et à quel taux."
        action={
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/analytics?period=${p.id}`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${p.id === active.id ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"}`}
              >
                {p.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Commandes" value={String(m.total)} sub={`${m.confirmed} confirmées · ${m.refused} refusées`} />
        <Metric label="Taux de confirmation" value={pct(m.confirmRate)} sub={`${m.confirmed} / ${m.total}`} />
        <Metric label="Taux de livraison" value={pct(m.deliveryRate)} sub={`${m.delivered} livrées`} />
        <Metric label="Taux de refus" value={pct(m.refuseRate)} sub={`${m.refused} refusées`} />
        <Metric label="Revenus (livré)" value={formatDZD(m.revenue)} sub="Encaissé à la livraison" />
        <Metric label="Panier moyen" value={m.aov !== null ? formatDZD(m.aov) : "—"} sub="Par commande livrée" />
        <Metric label="Livrées" value={String(m.delivered)} />
        <Metric label="Période" value={active.label} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="db-card overflow-hidden">
          <div className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold">Top produits</div>
          {m.topProducts.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-500">Pas encore de données.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {m.topProducts.map((p) => (
                <li key={p.name} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="text-xs text-zinc-500">{p.qty} vendu(s)</span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatDZD(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="db-card overflow-hidden">
          <div className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold">Top wilayas</div>
          {m.topWilayas.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-500">Pas encore de données.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {m.topWilayas.map((w) => (
                <li key={w.code} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{wilayaByCode(w.code)?.name ?? w.code}</span>
                    <span className="text-xs text-zinc-500">{w.count} commande(s) · {formatDZD(w.revenue)} livré</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showCompare && (
        <div className="db-card mt-6 overflow-hidden">
          <div className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold">Comparaison entre boutiques</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">Indicateur</th>
                  {compared.map((c) => (
                    <th key={c.name} className="px-5 py-3 font-semibold text-zinc-900">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 tabular-nums">
                {(
                  [
                    ["Commandes", (x: StoreMetrics) => String(x.total)],
                    ["Confirmation", (x: StoreMetrics) => pct(x.confirmRate)],
                    ["Livraison", (x: StoreMetrics) => pct(x.deliveryRate)],
                    ["Refus", (x: StoreMetrics) => pct(x.refuseRate)],
                    ["Revenus", (x: StoreMetrics) => formatDZD(x.revenue)],
                    ["Panier moyen", (x: StoreMetrics) => (x.aov !== null ? formatDZD(x.aov) : "—")],
                  ] as [string, (x: StoreMetrics) => string][]
                ).map(([label, fn]) => (
                  <tr key={label}>
                    <td className="px-5 py-2.5 text-zinc-500">{label}</td>
                    {compared.map((c) => (
                      <td key={c.name} className="px-5 py-2.5 font-medium">{fn(c.m)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
