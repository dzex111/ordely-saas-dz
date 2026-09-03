import { desc, eq, count } from "drizzle-orm";
import { db } from "@/db";
import { products, subscriptions } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/ui";
import { PlanCards } from "@/components/dashboard/PlanCards";

export default async function BillingPage() {
  const { store } = await requireStore();
  const plan = getPlan(store.plan);
  const [history, [{ n }]] = await Promise.all([
    db.query.subscriptions.findMany({ where: eq(subscriptions.storeId, store.id), orderBy: [desc(subscriptions.createdAt)], limit: 10 }),
    db.select({ n: count() }).from(products).where(eq(products.storeId, store.id)),
  ]);
  return (
    <>
      <PageHeader title="Abonnement" description="Commencez gratuitement, montez en gamme quand les commandes suivent." />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="db-card p-5"><p className="text-xs text-zinc-500">Plan actuel</p><p className="mt-1 text-xl font-semibold">{plan.name}</p><p className="text-xs text-zinc-500">{store.planStatus === "trialing" && store.trialEndsAt ? `Essai jusqu’au ${formatDate(store.trialEndsAt)}` : "Actif"}</p></div>
        <div className="db-card p-5"><p className="text-xs text-zinc-500">Produits</p><p className="mt-1 text-xl font-semibold">{n}{plan.productLimit ? ` / ${plan.productLimit}` : ""}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-zinc-900" style={{ width: plan.productLimit ? `${Math.min(100, (n / plan.productLimit) * 100)}%` : "8%" }} /></div></div>
        <div className="db-card p-5"><p className="text-xs text-zinc-500">Paiement</p><p className="mt-1 text-sm font-semibold">Via l’admin</p><p className="text-xs text-zinc-500">Choisissez un plan ci-dessous puis contactez-nous via le formulaire. Rien ne change sans validation manuelle.</p></div>
      </div>
      <PlanCards current={store.plan} />
      {history.length > 0 && (
        <div className="db-card mt-8 overflow-hidden">
          <div className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold">Historique</div>
          <ul className="divide-y divide-zinc-100 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between px-5 py-3">
                <span>{getPlan(h.plan).name} <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] uppercase text-zinc-600">{h.status}</span></span>
                <span className="text-xs text-zinc-500">{formatDate(h.createdAt)} · {h.provider}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
