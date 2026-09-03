import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { Plus, ExternalLink } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { formatDZD, storeUrl } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";

const STATUS: Record<string, { l: string; c: string }> = {
  active: { l: "En ligne", c: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  draft: { l: "Brouillon", c: "bg-zinc-100 text-zinc-600 ring-zinc-200" },
  archived: { l: "Archivé", c: "bg-zinc-100 text-zinc-500 ring-zinc-200" },
};

export default async function ProductsPage() {
  const { store } = await requireStore();
  const rows = await db.query.products.findMany({ where: eq(products.storeId, store.id), orderBy: [desc(products.featured), asc(products.sortOrder), desc(products.createdAt)] });
  const plan = getPlan(store.plan);
  const limit = plan.productLimit;

  return (
    <>
      <PageHeader title="Produits" description={limit ? `${rows.length} / ${limit} produits sur le plan ${plan.name}.` : `${rows.length} produits · illimité.`} action={<Link href="/dashboard/products/new" className="db-btn"><Plus className="h-4 w-4" /> Nouveau produit</Link>} />
      {rows.length === 0 ? (
        <EmptyState title="Votre catalogue est vide" description="Ajoutez votre premier produit : photos, prix, histoire, options. Il apparaît instantanément sur votre boutique avec un formulaire de commande COD." cta={{ href: "/dashboard/products/new", label: "Créer mon premier produit" }} />
      ) : (
        <div className="db-card overflow-hidden">
          <ul className="divide-y divide-zinc-100">
            {rows.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-4 py-3 transition hover:bg-zinc-50">
                <Link href={`/dashboard/products/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-lg bg-zinc-100" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name} {p.featured && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">Vedette</span>}</p>
                    <p className="truncate text-xs text-zinc-500">{p.shortDescription || "—"}</p>
                  </div>
                </Link>
                <span className={`hidden rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset sm:inline ${STATUS[p.status]?.c}`}>{STATUS[p.status]?.l}</span>
                <span className="hidden w-20 text-right text-xs text-zinc-500 md:block">{p.stock === null ? "Stock ∞" : `${p.stock} en stock`}</span>
                <span className="w-24 text-right text-sm font-semibold tabular-nums">{formatDZD(p.price)}</span>
                <a href={storeUrl(store.subdomain, `/p/${p.slug}`)} target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900" aria-label="Voir sur la boutique"><ExternalLink className="h-4 w-4" /></a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
