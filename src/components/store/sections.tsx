import Link from "next/link";
import { ArrowRight, ArrowUpRight, Phone, ShieldCheck, Truck, RotateCcw, Sparkles, MessageCircle, Camera, ThumbsUp } from "lucide-react";
import type { Product, Store } from "@/db/schema";
import type { ResolvedTheme } from "@/lib/templates";
import { formatDZD, cn } from "@/lib/utils";

type Ctx = { store: Store; theme: ResolvedTheme; base: string };

/* ------------------------------- Announcement ------------------------------ */

export function Announcement({ theme }: Ctx) {
  const text = theme.content.announcement;
  if (!text) return null;
  const items = Array.from({ length: 8 }, () => text);
  return (
    <div className="overflow-hidden border-b text-xs font-medium tracking-wide" style={{ background: "var(--primary)", color: "var(--primary-fg)", borderColor: "var(--border)" }}>
      <div className="flex w-max animate-marquee py-2">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="mx-8 whitespace-nowrap">
            {t} <span className="mx-6 opacity-50">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Header --------------------------------- */

export function Header({ store, theme, base }: Ctx) {
  const v = theme.template.layout.header;
  const Logo = (
    <Link href={base || "/"} className="flex items-center gap-2.5">
      {store.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.logoUrl} alt={store.name} className="h-8 w-auto object-contain" />
      ) : (
        <span className="display text-xl tracking-tight md:text-2xl">{store.name}</span>
      )}
    </Link>
  );
  const nav = (
    <nav className="hidden items-center gap-7 text-sm sf-muted md:flex">
      <Link href={`${base}/#produits`} className="transition hover:opacity-70" style={{ color: "var(--fg)" }}>
        Produits
      </Link>
      <Link href={`${base}/#apropos`} className="transition hover:opacity-70" style={{ color: "var(--fg)" }}>
        À propos
      </Link>
      <Link href={`${base}/#livraison`} className="transition hover:opacity-70" style={{ color: "var(--fg)" }}>
        Livraison
      </Link>
    </nav>
  );
  const contact = theme.content.whatsapp || theme.content.phone;
  const cta = contact ? (
    <a href={theme.content.whatsapp ? `https://wa.me/213${theme.content.whatsapp.replace(/\D/g, "").replace(/^0/, "")}` : `tel:${theme.content.phone}`} target="_blank" rel="noreferrer" className="sf-btn-ghost !py-2 !px-3.5 text-xs">
      <Phone className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Contact</span>
    </a>
  ) : (
    <Link href={`${base}/#produits`} className="sf-btn !py-2 !px-4 text-xs">
      Commander
    </Link>
  );

  if (v === "centered") {
    return (
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto grid max-w-7xl grid-cols-3 items-center px-5 py-5 md:px-8">
          <div>{nav}</div>
          <div className="flex justify-center">{Logo}</div>
          <div className="flex justify-end">{cta}</div>
        </div>
      </header>
    );
  }
  if (v === "pill") {
    return (
      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full border px-5 py-2.5 backdrop-blur-xl" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--bg) 70%, transparent)" }}>
          {Logo}
          {nav}
          {cta}
        </div>
      </header>
    );
  }
  if (v === "bar") {
    return (
      <header className="sticky top-0 z-40 border-b backdrop-blur-lg" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
          <div className="flex items-center gap-8">
            {Logo}
            {nav}
          </div>
          {cta}
        </div>
      </header>
    );
  }
  return (
    <header>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
        {Logo}
        <div className="flex items-center gap-6">
          {nav}
          {cta}
        </div>
      </div>
    </header>
  );
}

/* ----------------------------------- Hero ---------------------------------- */

export function Hero({ store, theme, base, products }: Ctx & { products: Product[] }) {
  const c = theme.content;
  const v = theme.template.layout.hero;
  const image = c.heroImage || products.find((p) => p.images[0])?.images[0] || null;
  const second = products.find((p) => p.images[0] && p.images[0] !== image)?.images[0] ?? null;
  const cta = (
    <Link href={`${base}/#produits`} className="sf-btn">
      {c.heroCta} <ArrowRight className="h-4 w-4" />
    </Link>
  );
  const Img = ({ src, className, style }: { src: string | null; className?: string; style?: React.CSSProperties }) =>
    src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={cn("h-full w-full object-cover", className)} style={style} />
    ) : (
      <div className={cn("h-full w-full", className)} style={{ background: "linear-gradient(135deg, var(--card), var(--border))", ...style }} />
    );

  if (v === "editorial") {
    return (
      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-10 md:grid-cols-12 md:px-8 md:pt-16">
        <div className="flex flex-col justify-center md:col-span-6 lg:col-span-5">
          <p className="mb-6 text-xs uppercase tracking-[0.3em] sf-muted animate-fade-up">{c.heroEyebrow}</p>
          <h1 className="text-5xl leading-[0.98] md:text-6xl lg:text-7xl animate-fade-up" style={{ animationDelay: "80ms" }}>
            {c.heroHeadline}
          </h1>
          <p className="mt-7 max-w-md text-base leading-relaxed sf-muted animate-fade-up" style={{ animationDelay: "160ms" }}>
            {c.heroSub}
          </p>
          <div className="mt-9 flex items-center gap-4 animate-fade-up" style={{ animationDelay: "240ms" }}>
            {cta}
            <span className="text-xs sf-muted">Paiement à la livraison</span>
          </div>
        </div>
        <div className="relative md:col-span-6 lg:col-span-7">
          <div className="sf-img aspect-[4/5] md:aspect-[5/6] lg:ml-12">
            <Img src={image} />
          </div>
          {second && (
            <div className="sf-img absolute -bottom-6 -left-2 hidden w-40 border-4 lg:block" style={{ borderColor: "var(--bg)", aspectRatio: "3 / 4" }}>
              <Img src={second} />
            </div>
          )}
        </div>
      </section>
    );
  }

  if (v === "glow") {
    return (
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-0" style={{ background: "radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--primary) 35%, transparent), transparent 70%)" }} />
        <div className="pointer-events-none absolute inset-0 -z-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse at top, black, transparent 70%)" }} />
        <div className="relative mx-auto max-w-5xl px-5 pb-10 pt-20 text-center md:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium animate-fade-up" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} /> {c.heroEyebrow}
          </span>
          <h1 className="mx-auto mt-7 max-w-3xl text-5xl tracking-tight md:text-7xl animate-fade-up" style={{ animationDelay: "80ms" }}>
            {c.heroHeadline}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed sf-muted md:text-lg animate-fade-up" style={{ animationDelay: "160ms" }}>
            {c.heroSub}
          </p>
          <div className="mt-9 flex items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "240ms" }}>
            {cta}
            <Link href={`${base}/#apropos`} className="sf-btn-ghost">
              En savoir plus
            </Link>
          </div>
        </div>
        {image && (
          <div className="relative mx-auto max-w-5xl px-5 pb-16">
            <div className="sf-card overflow-hidden p-2 shadow-2xl" style={{ boxShadow: "0 40px 120px -40px color-mix(in srgb, var(--primary) 50%, transparent)" }}>
              <div className="sf-img aspect-[16/8]">
                <Img src={image} />
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (v === "soft") {
    return (
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 overflow-hidden px-5 pb-16 pt-8 md:grid-cols-2 md:px-8 md:pt-12">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: "var(--primary)" }} />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full opacity-30 blur-3xl" style={{ background: "var(--accent)" }} />
        <div className="relative">
          <span className="inline-block rounded-full px-3.5 py-1.5 text-xs font-semibold animate-fade-up" style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent)" }}>
            {c.heroEyebrow}
          </span>
          <h1 className="mt-6 text-5xl md:text-6xl lg:text-[4.25rem] animate-fade-up" style={{ animationDelay: "80ms" }}>
            {c.heroHeadline}
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed sf-muted md:text-lg animate-fade-up" style={{ animationDelay: "160ms" }}>
            {c.heroSub}
          </p>
          <div className="mt-8 animate-fade-up" style={{ animationDelay: "240ms" }}>
            {cta}
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden shadow-2xl" style={{ borderRadius: "46% 54% 52% 48% / 42% 46% 54% 58%", boxShadow: "0 40px 80px -30px color-mix(in srgb, var(--primary) 35%, transparent)" }}>
            <Img src={image} />
          </div>
          {second && (
            <div className="absolute -bottom-4 -left-6 hidden h-36 w-36 overflow-hidden rounded-full border-8 md:block" style={{ borderColor: "var(--bg)" }}>
              <Img src={second} />
            </div>
          )}
        </div>
      </section>
    );
  }

  if (v === "fullbleed") {
    return (
      <section className="relative min-h-[82vh] overflow-hidden">
        <div className="absolute inset-0">
          <Img src={image} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,8,6,0.85) 0%, rgba(10,8,6,0.35) 45%, rgba(10,8,6,0.05) 100%)" }} />
        </div>
        <div className="relative mx-auto flex min-h-[82vh] max-w-7xl flex-col justify-end px-5 pb-16 md:px-8 md:pb-20">
          <p className="mb-5 text-xs uppercase tracking-[0.3em] text-white/70 animate-fade-up">{c.heroEyebrow}</p>
          <h1 className="max-w-3xl text-5xl italic text-white md:text-7xl animate-fade-up" style={{ animationDelay: "80ms" }}>
            {c.heroHeadline}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/80 animate-fade-up" style={{ animationDelay: "160ms" }}>
            {c.heroSub}
          </p>
          <div className="mt-8 animate-fade-up" style={{ animationDelay: "240ms" }}>
            <Link href={`${base}/#produits`} className="sf-btn !bg-white !text-black">
              {c.heroCta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (v === "stacked") {
    const words = c.heroHeadline.split(" ");
    const last = words.pop();
    return (
      <section className="overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 pt-12 md:px-8 md:pt-16">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--accent)" }} /> {c.heroEyebrow}
          </div>
          <h1 className="mt-6 text-[13vw] leading-[0.85] tracking-tight md:text-[9vw] animate-fade-up">
            {words.join(" ")} <span style={{ background: "var(--accent)", color: "var(--fg)", padding: "0 0.1em" }}>{last}</span>
          </h1>
          <div className="mt-8 grid gap-8 md:grid-cols-12 md:items-end">
            <p className="text-base font-medium leading-relaxed md:col-span-5 md:text-lg">{c.heroSub}</p>
            <div className="md:col-span-7 md:text-right">{cta}</div>
          </div>
        </div>
        <div className="mt-10 overflow-hidden border-y py-3 text-sm font-black uppercase tracking-widest" style={{ background: "var(--fg)", color: "var(--accent)", borderColor: "var(--fg)" }}>
          <div className="flex w-max animate-marquee">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="mx-6 whitespace-nowrap">
                {c.trustItems[i % c.trustItems.length]} <span className="mx-4 opacity-60">◆</span>
              </span>
            ))}
          </div>
        </div>
        {image && (
          <div className="mx-auto grid max-w-7xl gap-2 px-5 py-2 md:grid-cols-3 md:px-8">
            <div className="sf-img aspect-[4/3] md:col-span-2">
              <Img src={image} />
            </div>
            <div className="sf-img hidden aspect-[4/3] md:block md:aspect-auto">
              <Img src={second ?? image} />
            </div>
          </div>
        )}
      </section>
    );
  }

  if (v === "minimal") {
    return (
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 text-center md:px-8 md:pt-24">
        <div className="mx-auto mb-8 h-px w-16" style={{ background: "var(--accent)" }} />
        <p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: "var(--accent)" }}>
          {c.heroEyebrow}
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-tight md:text-6xl animate-fade-up">{c.heroHeadline}</h1>
        <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed sf-muted md:text-base animate-fade-up" style={{ animationDelay: "120ms" }}>
          {c.heroSub}
        </p>
        <div className="mt-9 animate-fade-up" style={{ animationDelay: "200ms" }}>
          {cta}
        </div>
        {image && (
          <div className="mt-16 border p-3" style={{ borderColor: "var(--border)" }}>
            <div className="aspect-[21/9] overflow-hidden">
              <Img src={image} />
            </div>
          </div>
        )}
      </section>
    );
  }

  // market
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:px-8 md:pt-14">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border-2 border-dashed px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider" style={{ borderColor: "var(--accent)", color: "var(--primary)" }}>
          {c.heroEyebrow}
        </p>
        <h1 className="mt-6 text-5xl md:text-6xl lg:text-7xl animate-fade-up">
          <span style={{ backgroundImage: "linear-gradient(transparent 60%, color-mix(in srgb, var(--accent) 45%, transparent) 60%)" }}>{c.heroHeadline}</span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed sf-muted md:text-lg animate-fade-up" style={{ animationDelay: "120ms" }}>
          {c.heroSub}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
          {cta}
          <span className="flex items-center gap-2 text-sm font-medium">
            <Truck className="h-4 w-4" style={{ color: "var(--primary)" }} /> Livraison 58 wilayas
          </span>
        </div>
      </div>
      <div className="relative">
        <div className="sf-img aspect-square rotate-[-1.5deg] shadow-xl">
          <Img src={image} />
        </div>
        <div className="absolute -right-3 -top-4 flex h-24 w-24 rotate-12 items-center justify-center rounded-full text-center text-xs font-black uppercase leading-tight shadow-lg md:h-28 md:w-28" style={{ background: "var(--accent)", color: "var(--fg)" }}>
          Paiement
          <br />à la
          <br />
          livraison
        </div>
        <div className="absolute -bottom-4 left-6 rounded-full px-4 py-2 text-sm font-bold shadow-lg" style={{ background: "var(--primary)", color: "var(--primary-fg)" }}>
          100% naturel
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Trust strip ------------------------------ */

const TRUST_ICONS = [ShieldCheck, Truck, RotateCcw, Phone, Sparkles, MessageCircle];

export function TrustStrip({ theme }: Ctx) {
  const items = theme.content.trustItems;
  if (!items.length) return null;
  const luxe = theme.template.id === "luxe";
  return (
    <section id="livraison" className={cn("border-y", luxe && "text-center")} style={{ borderColor: "var(--border)", background: luxe ? "transparent" : "color-mix(in srgb, var(--card) 60%, var(--bg))" }}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4 md:px-8">
        {items.slice(0, 4).map((t, i) => {
          const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
          return (
            <div key={t} className={cn("flex items-center gap-3", luxe && "flex-col gap-2")}>
              <Icon className="h-5 w-5 shrink-0" style={{ color: "var(--accent)" }} strokeWidth={1.75} />
              <span className="text-sm font-medium">{t}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* --------------------------------- Product card ---------------------------- */

export function ProductCard({ product, theme, base, index }: { product: Product; theme: ResolvedTheme; base: string; index: number }) {
  const v = theme.template.layout.card;
  const href = `${base}/p/${product.slug}`;
  const img = product.images[0];
  const discount = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;
  const soldOut = product.stock !== null && product.stock <= 0;
  const Image = (
    <div className="sf-img relative" style={{ aspectRatio: "var(--img-ratio)" }}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={product.name} loading={index < 3 ? "eager" : "lazy"} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs sf-muted">Sans image</div>
      )}
      {discount && v !== "market" && (
        <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "var(--accent)", color: v === "tech" || v === "luxe" ? "#0b0b0b" : "var(--fg)" }}>
          −{discount}%
        </span>
      )}
      {soldOut && <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 text-center text-xs font-semibold text-white">Épuisé</span>}
    </div>
  );
  const Price = ({ className }: { className?: string }) => (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="font-semibold">{formatDZD(product.price)}</span>
      {product.compareAtPrice && product.compareAtPrice > product.price && <span className="text-xs line-through sf-muted">{formatDZD(product.compareAtPrice)}</span>}
    </div>
  );

  if (v === "tech") {
    return (
      <Link href={href} className="group sf-card flex flex-col p-3 transition hover:-translate-y-1" style={{ boxShadow: "0 0 0 1px transparent" }}>
        {Image}
        <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-4">
          <h3 className="text-base font-semibold leading-snug">{product.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed sf-muted">{product.shortDescription}</p>
          <div className="mt-4 flex items-center justify-between">
            <Price />
            <span className="flex h-8 w-8 items-center justify-center rounded-full transition group-hover:scale-110" style={{ background: "var(--primary)", color: "var(--primary-fg)" }}>
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    );
  }
  if (v === "soft") {
    return (
      <Link href={href} className="group sf-card flex flex-col p-3 transition hover:shadow-xl" style={{ boxShadow: "0 10px 30px -20px color-mix(in srgb, var(--primary) 30%, transparent)" }}>
        {Image}
        <div className="px-2 pb-2 pt-4">
          <h3 className="text-lg leading-snug">{product.name}</h3>
          <p className="mt-1 line-clamp-1 text-xs sf-muted">{product.shortDescription}</p>
          <div className="mt-3 flex items-center justify-between">
            <Price />
            <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
              Commander
            </span>
          </div>
        </div>
      </Link>
    );
  }
  if (v === "bold") {
    return (
      <Link href={href} className="group flex flex-col border-2 transition hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--fg)]" style={{ borderColor: "var(--fg)" }}>
        {Image}
        <div className="border-t-2 p-4" style={{ borderColor: "var(--fg)" }}>
          <h3 className="text-lg font-extrabold uppercase leading-none tracking-tight">{product.name}</h3>
          <div className="mt-3 flex items-center justify-between">
            <Price className="text-lg" />
            <span className="text-xs font-black uppercase tracking-widest">Shop →</span>
          </div>
        </div>
      </Link>
    );
  }
  if (v === "luxe") {
    return (
      <Link href={href} className="group flex flex-col text-center">
        <div className="border p-2 transition group-hover:border-[var(--accent)]" style={{ borderColor: "var(--border)" }}>
          {Image}
        </div>
        <h3 className="mt-5 text-lg">{product.name}</h3>
        <p className="mt-1 text-[11px] uppercase tracking-[0.25em]" style={{ color: "var(--accent)" }}>
          {formatDZD(product.price)}
        </p>
      </Link>
    );
  }
  if (v === "market") {
    return (
      <Link href={href} className="group sf-card relative flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
        {Image}
        <span className="absolute right-3 top-3 rounded-full px-3 py-1.5 text-sm font-black shadow" style={{ background: "var(--accent)", color: "var(--fg)" }}>
          {formatDZD(product.price)}
        </span>
        <div className="p-4">
          <h3 className="text-lg font-semibold leading-snug">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed sf-muted">{product.shortDescription}</p>
          {discount && <p className="mt-2 text-xs font-bold" style={{ color: "var(--primary)" }}>Économisez {discount}%</p>}
        </div>
      </Link>
    );
  }
  if (v === "warm") {
    return (
      <Link href={href} className="group flex flex-col">
        {Image}
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base">{product.name}</h3>
            <p className="mt-0.5 line-clamp-1 text-xs sf-muted">{product.shortDescription}</p>
          </div>
          <Price className="shrink-0 text-sm" />
        </div>
      </Link>
    );
  }
  // editorial
  return (
    <Link href={href} className="group flex flex-col">
      {Image}
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="text-xl leading-tight">{product.name}</h3>
        <Price className="shrink-0 text-sm" />
      </div>
      <p className="mt-1 text-xs uppercase tracking-widest sf-muted">{product.options[0]?.values.slice(0, 4).join(" · ") || "Pièce unique"}</p>
    </Link>
  );
}

/* ---------------------------------- About ---------------------------------- */

export function About({ theme, products }: Ctx & { products: Product[] }) {
  const c = theme.content;
  const img = products[1]?.images[0] ?? products[0]?.images[0];
  return (
    <section id="apropos" className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:px-8">
      <div className="order-2 md:order-1">
        <p className="text-xs uppercase tracking-[0.3em] sf-muted">{c.aboutTitle}</p>
        <h2 className="mt-4 text-3xl md:text-4xl">{theme.content.heroEyebrow}</h2>
        <p className="mt-6 max-w-md text-base leading-relaxed sf-muted">{c.aboutText}</p>
        <div className="mt-8 flex flex-wrap gap-2">
          {c.trustItems.map((t) => (
            <span key={t} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--border)" }}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="order-1 md:order-2">
        <div className="sf-img aspect-[4/3]">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full" style={{ background: "var(--card)" }} />
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- Footer --------------------------------- */

export function Footer({ store, theme, base }: Ctx) {
  const c = theme.content;
  const s = store.settings;
  return (
    <footer className="border-t" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <p className="display text-2xl">{store.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed sf-muted">{store.tagline || c.heroSub}</p>
          <div className="mt-5 flex gap-3">
            {c.instagram && (
              <a href={`https://instagram.com/${c.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="sf-btn-ghost !p-2.5" aria-label="Instagram">
                <Camera className="h-4 w-4" />
              </a>
            )}
            {c.facebook && (
              <a href={c.facebook.startsWith("http") ? c.facebook : `https://facebook.com/${c.facebook}`} target="_blank" rel="noreferrer" className="sf-btn-ghost !p-2.5" aria-label="Facebook">
                <ThumbsUp className="h-4 w-4" />
              </a>
            )}
            {c.whatsapp && (
              <a href={`https://wa.me/213${c.whatsapp.replace(/\D/g, "").replace(/^0/, "")}`} target="_blank" rel="noreferrer" className="sf-btn-ghost !p-2.5" aria-label="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest">Livraison</p>
          <ul className="mt-4 space-y-2 text-sm sf-muted">
            <li>Domicile : {formatDZD(s.homeDeliveryFee)}</li>
            <li>Point relais : {formatDZD(s.deskDeliveryFee)}</li>
            {s.freeShippingThreshold !== null && <li>Offerte dès {formatDZD(s.freeShippingThreshold)}</li>}
            <li>Nord 24–48h · Sud 3–5 jours</li>
            <li>Retour sous {s.returnDays} jours</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest">Contact</p>
          <ul className="mt-4 space-y-2 text-sm sf-muted">
            {c.phone && <li><a href={`tel:${c.phone}`}>{c.phone}</a></li>}
            {c.email && <li><a href={`mailto:${c.email}`}>{c.email}</a></li>}
            <li><Link href={`${base}/#produits`}>Tous les produits</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-[11px] sf-muted md:flex-row md:px-8">
          <span>© {new Date().getFullYear()} {store.name}. {c.footerNote}</span>
          <span>
            Propulsé par <Link href="/" className="font-semibold" style={{ color: "var(--fg)" }}>ORDELY</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
