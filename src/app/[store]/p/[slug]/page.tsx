import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Truck, PhoneCall, RotateCcw } from "lucide-react";
import { getActiveProductBySlug, getActiveProducts } from "@/lib/store-data";
import { getStoreCtx } from "@/lib/store-ctx";
import { Gallery } from "@/components/store/Gallery";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { ProductCard } from "@/components/store/sections";
import { st, storeLangOf } from "@/lib/store-i18n";
import { formatDZD } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ store: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { store: sub, slug } = await params;
  const ctx = await getStoreCtx(sub);
  if (!ctx) return {};
  const product = await getActiveProductBySlug(ctx.store.id, slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription || product.description.slice(0, 160),
    openGraph: { title: `${product.name} · ${ctx.store.name}`, description: product.shortDescription, images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { store: sub, slug } = await params;
  const ctx = await getStoreCtx(sub);
  if (!ctx) notFound();
  const { store, theme, base } = ctx;
  const lang = storeLangOf(store.settings.language);
  const t = st(lang);
  const product = await getActiveProductBySlug(store.id, slug);
  if (!product) notFound();
  const others = (await getActiveProducts(store.id)).filter((p) => p.id !== product.id).slice(0, 3);
  const discount = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;
  const paragraphs = product.description.split(/\n{2,}/).filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.shortDescription,
    offers: { "@type": "Offer", priceCurrency: "DZD", price: product.price, availability: product.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-6 md:px-8 md:pt-10">
        <nav className="mb-6 flex items-center gap-1.5 text-xs sf-muted">
          <Link href={base || "/"} className="hover:underline">{store.name}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`${base}/#produits`} className="hover:underline">{t.crumbProducts}</Link>
          <ChevronRight className="h-3 w-3" />
          <span style={{ color: "var(--fg)" }}>{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-6">
              <Gallery images={product.images} name={product.name} lang={lang} />
              {product.features.length > 0 && (
                <div className="mt-8 hidden grid-cols-2 gap-3 lg:grid">
                  {product.features.map((f) => (
                    <div key={f.title} className="sf-card p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-widest sf-muted">{f.title}</p>
                      <p className="mt-1 text-sm">{f.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            {discount && (
              <span className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--accent)", color: theme.template.id === "nova" || theme.template.id === "luxe" ? "#0b0b0b" : "var(--fg)" }}>
                {t.offer} −{discount}%
              </span>
            )}
            <h1 className="text-4xl leading-tight md:text-5xl">{product.name}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-semibold tabular-nums">{formatDZD(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && <span className="text-base line-through sf-muted">{formatDZD(product.compareAtPrice)}</span>}
              {product.stock !== null && product.stock > 0 && product.stock <= 5 && <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{t.onlyLeft(product.stock)}</span>}
            </div>
            {product.shortDescription && <p className="mt-5 text-base leading-relaxed sf-muted">{product.shortDescription}</p>}

            <div className="mt-7">
              <CheckoutForm storeId={store.id} product={product} settings={store.settings} />
            </div>

            <ul className="mt-6 grid grid-cols-2 gap-3 text-xs">
              {[
                { I: ShieldCheck, t: t.perk1 },
                { I: Truck, t: t.perk2 },
                { I: PhoneCall, t: t.perk3 },
                { I: RotateCcw, t: t.perk4(store.settings.returnDays) },
              ].map(({ I, t }) => (
                <li key={t} className="flex items-center gap-2 sf-muted">
                  <I className="h-4 w-4" style={{ color: "var(--accent)" }} strokeWidth={1.75} /> {t}
                </li>
              ))}
            </ul>

            {product.features.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-3 lg:hidden">
                {product.features.map((f) => (
                  <div key={f.title} className="sf-card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest sf-muted">{f.title}</p>
                    <p className="mt-1 text-sm">{f.text}</p>
                  </div>
                ))}
              </div>
            )}

            {paragraphs.length > 0 && (
              <div className="mt-10 border-t pt-8" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-2xl">{t.story}</h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed sf-muted">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {others.length > 0 && (
          <section className="mt-24">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="text-2xl md:text-3xl">{t.alsoLike}</h2>
              <Link href={`${base}/#produits`} className="text-sm underline-offset-4 hover:underline">{t.seeAll}</Link>
            </div>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
              {others.map((p, i) => (
                <ProductCard key={p.id} product={p} theme={theme} base={base} index={i + 3} lang={lang} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
