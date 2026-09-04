import { notFound } from "next/navigation";
import { getActiveProducts } from "@/lib/store-data";
import { getStoreCtx } from "@/lib/store-ctx";
import { st, storeLangOf } from "@/lib/store-i18n";
import { About, Hero, ProductCard, TrustStrip } from "@/components/store/sections";

export const dynamic = "force-dynamic";

export default async function StoreHome({ params }: { params: Promise<{ store: string }> }) {
  const { store: sub } = await params;
  const ctx = await getStoreCtx(sub);
  if (!ctx) notFound();
  const { store, theme, base } = ctx;
  const lang = storeLangOf(store.settings.language);
  const t = st(lang);
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
            <p className="text-xs uppercase tracking-[0.3em] sf-muted">{t.selection}</p>
            <h2 className="mt-3 text-3xl md:text-4xl">{products.length > 0 ? t.ourProducts : t.comingSoon}</h2>
          </div>
          <p className="hidden text-sm sf-muted md:block">
            {t.productsCount(products.length)}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="sf-card flex flex-col items-center justify-center px-6 py-20 text-center">
            <p className="text-lg">{t.emptyTitle}</p>
            <p className="mt-2 max-w-sm text-sm sf-muted">{t.emptyDesc}</p>
          </div>
        ) : (
          <div className={`grid ${gridCols} ${gap}`}>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} theme={theme} base={base} index={i} lang={lang} />
            ))}
          </div>
        )}
      </section>

      <About store={store} theme={theme} base={base} products={products} />

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="sf-card grid gap-8 px-6 py-10 md:grid-cols-3 md:px-10">
            {[
              { n: "01", t: t.step1t, d: t.step1d },
              { n: "02", t: t.step2t, d: t.step2d },
              { n: "03", t: t.step3t, d: t.step3d(store.settings.returnDays) },
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
