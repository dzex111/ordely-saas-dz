import { notFound } from "next/navigation";
import { getActiveProducts } from "@/lib/store-data";
import { getStoreCtx } from "@/lib/store-ctx";
import { About, Hero, ProductCard, TrustStrip } from "@/components/store/sections";

export const dynamic = "force-dynamic";

export default async function StoreHome({ params }: { params: Promise<{ store: string }> }) {
  const { store: sub } = await params;
  const ctx = await getStoreCtx(sub);
  if (!ctx) notFound();
  const { store, theme, base } = ctx;
  const products = await getActiveProducts(store.id);
  const v = theme.template.layout.card;
  const gridCols =
    v === "editorial" || v === "luxe" ? "grid-cols-2 lg:grid-cols-3" : v === "warm" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  const gap = v === "editorial" ? "gap-x-6 gap-y-12" : v === "luxe" ? "gap-x-8 gap-y-14" : "gap-5 md:gap-6";

  return (
    <>
      <Hero store={store} theme={theme} base={base} products={products} />
      <TrustStrip store={store} theme={theme} base={base} />

      <section id="produits" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] sf-muted">Sélection</p>
            <h2 className="mt-3 text-3xl md:text-4xl">{products.length > 0 ? "Nos produits" : "Bientôt disponible"}</h2>
          </div>
          <p className="hidden text-sm sf-muted md:block">
            {products.length} {products.length > 1 ? "produits" : "produit"} · paiement à la livraison
          </p>
        </div>

        {products.length === 0 ? (
          <div className="sf-card flex flex-col items-center justify-center px-6 py-20 text-center">
            <p className="text-lg">La collection arrive très bientôt.</p>
            <p className="mt-2 max-w-sm text-sm sf-muted">Suivez-nous pour être averti du lancement. Paiement à la livraison partout en Algérie.</p>
          </div>
        ) : (
          <div className={`grid ${gridCols} ${gap}`}>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} theme={theme} base={base} index={i} />
            ))}
          </div>
        )}
      </section>

      <About store={store} theme={theme} base={base} products={products} />

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="sf-card grid gap-8 px-6 py-10 md:grid-cols-3 md:px-10">
          {[
            { n: "01", t: "Vous commandez", d: "Remplissez le formulaire en 30 secondes. Aucun paiement en ligne, aucune carte." },
            { n: "02", t: "Nous confirmons", d: "Un appel ou un message WhatsApp pour valider votre commande et l’adresse." },
            { n: "03", t: "Vous payez à la réception", d: `Livraison dans les 58 wilayas. Vous vérifiez, puis vous réglez le livreur. Retour sous ${store.settings.returnDays} jours.` },
          ].map((s) => (
            <div key={s.n}>
              <p className="display text-3xl" style={{ color: "var(--accent)" }}>{s.n}</p>
              <p className="mt-3 text-lg font-semibold">{s.t}</p>
              <p className="mt-2 text-sm leading-relaxed sf-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
