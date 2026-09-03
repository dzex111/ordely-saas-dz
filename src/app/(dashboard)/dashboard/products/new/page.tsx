import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStore } from "@/lib/auth";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { PageHeader } from "@/components/dashboard/ui";

export default async function NewProductPage() {
  const { store } = await requireStore();
  return (
    <>
      <Link href="/dashboard/products" className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900"><ArrowLeft className="h-3.5 w-3.5" /> Produits</Link>
      <PageHeader title="Nouveau produit" description="Une belle fiche = plus de confiance = plus de commandes confirmées." />
      <ProductForm storePath={`/${store.subdomain}`} />
    </>
  );
}
