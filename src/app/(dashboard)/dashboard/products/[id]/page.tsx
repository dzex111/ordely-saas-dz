import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { canDo } from "@/lib/team";
import { storeUrl } from "@/lib/utils";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { PageHeader } from "@/components/dashboard/ui";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { store, role } = await requireStore();
  if (!canDo(role, "manageProducts")) redirect("/dashboard");
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const product = await db.query.products.findFirst({ where: and(eq(products.id, id), eq(products.storeId, store.id)) });
  if (!product) notFound();
  return (
    <>
      <Link href="/dashboard/products" className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900"><ArrowLeft className="h-3.5 w-3.5" /> Produits</Link>
      {created && <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Produit publié. Il est déjà visible sur votre boutique.</p>}
      <PageHeader title={product.name} action={<a href={storeUrl(store.subdomain, `/p/${product.slug}`)} target="_blank" rel="noreferrer" className="db-btn-secondary"><ExternalLink className="h-4 w-4" /> Voir la fiche</a>} />
      <ProductForm key={product.updatedAt.toISOString()} product={product} storePath={`/${store.subdomain}`} canDelete={canDo(role, "deleteProduct")} />
    </>
  );
}
