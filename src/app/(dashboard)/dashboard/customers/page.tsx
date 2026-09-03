import Link from "next/link";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { Search } from "lucide-react";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { wilayaByCode, formatPhone } from "@/lib/algeria";
import { formatDZD, formatDate } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { store } = await requireStore();
  const { q } = await searchParams;
  const rows = await db.query.customers.findMany({
    where: and(eq(customers.storeId, store.id), q ? or(ilike(customers.name, `%${q}%`), ilike(customers.phone, `%${q.replace(/\s/g, "")}%`)) : undefined),
    orderBy: [desc(customers.updatedAt)],
    limit: 200,
  });
  const byWilaya = rows.reduce<Record<string, number>>((acc, c) => ((acc[c.wilayaCode] = (acc[c.wilayaCode] ?? 0) + 1), acc), {});
  const top = Object.entries(byWilaya).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <PageHeader title="Clients" description="Chaque numéro de téléphone = un client. Les récurrents sont vos meilleurs ambassadeurs." action={
        <form className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input name="q" defaultValue={q ?? ""} placeholder="Nom ou téléphone…" className="db-input !pl-9 md:w-64" />
        </form>
      } />
      {rows.length === 0 ? (
        <EmptyState title={q ? "Aucun client trouvé" : "Aucun client pour l’instant"} description={q ? "Essayez un autre nom ou numéro." : "Vos clients apparaissent ici automatiquement dès leur première commande."} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="db-card overflow-hidden lg:col-span-3">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Wilaya</th>
                  <th className="px-4 py-3 text-right font-medium">Commandes</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Dernière</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders?q=${c.phone}`} className="block font-medium">{c.name}</Link>
                      <span className="text-xs text-zinc-500">{formatPhone(c.phone)}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-600 md:table-cell">{wilayaByCode(c.wilayaCode)?.name}, {c.commune}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.ordersCount}{c.ordersCount > 1 && <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">fidèle</span>}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatDZD(c.totalSpent)}</td>
                    <td className="hidden px-4 py-3 text-right text-xs text-zinc-500 md:table-cell">{formatDate(c.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="db-card h-fit p-5">
            <p className="text-sm font-semibold">Top wilayas</p>
            <ul className="mt-3 space-y-2">
              {top.map(([code, n]) => (
                <li key={code} className="flex items-center gap-3 text-sm">
                  <span className="w-28 truncate">{wilayaByCode(code)?.name}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100"><span className="block h-full rounded-full bg-zinc-900" style={{ width: `${(n / rows.length) * 100}%` }} /></span>
                  <span className="w-6 text-right text-xs tabular-nums text-zinc-500">{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
