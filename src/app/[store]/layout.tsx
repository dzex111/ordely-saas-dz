import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getStoreBySubdomain } from "@/lib/store-data";
import { getStoreCtx } from "@/lib/store-ctx";
import { Announcement, Footer, Header } from "@/components/store/sections";

type Props = { children: ReactNode; params: Promise<{ store: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { store: sub } = await params;
  const store = await getStoreBySubdomain(sub);
  if (!store) return { title: "Boutique introuvable" };
  return {
    title: { default: store.name, template: `%s · ${store.name}` },
    description: store.tagline || store.content.heroSub || `${store.name} — paiement à la livraison partout en Algérie.`,
    openGraph: { title: store.name, description: store.tagline, type: "website" },
    robots: store.published ? undefined : { index: false },
  };
}

export default async function StoreLayout({ children, params }: Props) {
  const { store: sub } = await params;
  const ctx = await getStoreCtx(sub);
  if (!ctx) notFound();
  const { store, theme, base } = ctx;
  const dark = isDark(theme.cssVars["--bg"]);
  return (
    <div className={dark ? "sf dark" : "sf"} style={theme.cssVars as React.CSSProperties} lang={store.settings.language}>
      {!store.published && (
        <div className="bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-black">Boutique en mode privé — visible uniquement par vous. Publiez-la depuis Paramètres.</div>
      )}
      <Announcement store={store} theme={theme} base={base} />
      <Header store={store} theme={theme} base={base} />
      <main>{children}</main>
      <Footer store={store} theme={theme} base={base} />
    </div>
  );
}

function isDark(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}
