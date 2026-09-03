import Link from "next/link";

export default function StoreNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Cette page n’existe pas</h1>
      <p className="mt-3 max-w-sm text-sm text-zinc-500">La boutique ou le produit demandé est introuvable, ou n’est plus disponible.</p>
      <Link href="/" className="mt-8 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white">Retour à ORDELY</Link>
    </div>
  );
}
