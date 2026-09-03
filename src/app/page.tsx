import Link from "next/link";
import { ArrowRight, Check, Smartphone, Truck, Palette, ShieldCheck, BarChart3, Globe2 } from "lucide-react";
import { db } from "@/db";
import { stores, users } from "@/db/schema";
import { asc, eq, like } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { TEMPLATES } from "@/lib/templates";
import { PLANS } from "@/lib/plans";
import { formatDZD } from "@/lib/utils";
import { TemplateGrid } from "@/components/store/TemplateGrid";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const [user, demos] = await Promise.all([getCurrentUser(), db.select({ subdomain: stores.subdomain, template: stores.template, name: stores.name }).from(stores).innerJoin(users, eq(users.id, stores.ownerId)).where(like(users.email, "demo%@ordely.app")).orderBy(asc(stores.createdAt)).limit(12)]);

  return (
    <div className="bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="ORDELY - home"><img src="/logo.svg" alt="ORDELY" className="h-9 w-auto" /></Link>
          <nav className="hidden items-center gap-8 text-sm text-zinc-600 md:flex">
            <a href="#templates" className="hover:text-ink">Templates</a>
            <a href="#how" className="hover:text-ink">Comment ça marche</a>
            <a href="#pricing" className="hover:text-ink">Tarifs</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">Tableau de bord</Link>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-medium text-zinc-700 hover:text-ink sm:block">Connexion</Link>
                <Link href="/signup" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">Créer ma boutique</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 40% at 50% 0%, #ff5a1f22, transparent 70%)" }} />
        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 text-center md:pt-32">
          <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-7xl animate-fade-up" style={{ animationDelay: "80ms" }}>
            Chaque marchand paraît <span className="text-brand">premium</span> en 10 minutes.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-zinc-600 animate-fade-up" style={{ animationDelay: "160ms" }}>
            ORDELY est le Shopify du contre-remboursement. Une boutique d’agence, un checkout COD qui inspire confiance, et un tableau de bord pour confirmer, expédier et encaisser.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up" style={{ animationDelay: "240ms" }}>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-zinc-800">
              Lancer ma boutique gratuitement <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#templates" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3.5 text-sm font-semibold transition hover:bg-zinc-50">Voir les templates</a>
          </div>
          <p className="mt-5 text-xs text-zinc-500">Gratuit jusqu’à 10 produits. Aucune carte bancaire.</p>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-8 md:grid-cols-4">
          {[
            { I: Palette, t: `${TEMPLATES.length} templates d’agence`, d: "Une personnalité par vertical." },
            { I: Smartphone, t: "Checkout COD 30 s", d: "Nom, téléphone, wilaya. C’est tout." },
            { I: Truck, t: "58 wilayas", d: "Tarifs domicile / relais par wilaya." },
            { I: ShieldCheck, t: "Zéro paiement en ligne", d: "Le client paie le livreur." },
          ].map(({ I, t, d }) => (
            <div key={t} className="flex items-start gap-3">
              <I className="mt-0.5 h-5 w-5 text-brand" strokeWidth={1.8} />
              <div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-zinc-500">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="templates" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Templates</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Sept univers. Zéro air de « site gratuit ».</h2>
          <p className="mt-4 text-zinc-600">Chaque template a sa typographie, sa palette, sa mise en page et son propre langage de conversion. Le marchand change tout — couleurs, polices, textes — sans casser la beauté.</p>
        </div>
        <TemplateGrid demos={demos} />
      </section>

      <section id="how" className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">Comment ça marche</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Du sign-up à la première commande, sans agence ni développeur.</h2>
              <ol className="mt-10 space-y-6">
                {[
                  ["Créez votre boutique", "Nom, sous-domaine, template. Trois produits exemples sont pré-remplis pour la voir vivante tout de suite."],
                  ["Ajoutez vos produits", "Photos, prix barré, options taille/couleur, points clés. Chaque produit a sa landing page optimisée."],
                  ["Recevez des commandes COD", "Le client renseigne nom, téléphone, wilaya et commune. Les frais s’affichent en direct. Aucun paiement en ligne."],
                  ["Confirmez, expédiez, encaissez", "Appel ou WhatsApp en un clic, statut suivi de « à confirmer » à « livrée », stock et clients mis à jour automatiquement."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-semibold">{i + 1}</span>
                    <div><p className="font-semibold">{t}</p><p className="mt-1 text-sm leading-relaxed text-white/60">{d}</p></div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { I: BarChart3, t: "Tableau de bord clair", d: "CA livré, en cours, taux de livraison, 14 jours de tendance." },
                { I: Truck, t: "Tarifs par wilaya", d: "Domicile ou point relais, seuil de gratuité, délais Nord / Sud." },
                { I: ShieldCheck, t: "Anti-doublon", d: "Clé d’idempotence, validation serveur, stock décrémenté en transaction." },
                { I: Globe2, t: "Global-ready", d: "Multi-tenant par sous-domaine, Supabase Auth & Storage, plans & abonnements." },
              ].map(({ I, t, d }) => (
                <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <I className="h-5 w-5 text-brand" strokeWidth={1.8} />
                  <p className="mt-3 font-semibold">{t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-24">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Tarifs</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Simple. Vous grandissez, on grandit.</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.id} className={`flex flex-col rounded-3xl border p-7 ${p.highlight ? "border-ink bg-ink text-white shadow-2xl" : "border-zinc-200 bg-white"}`}>
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="mt-4 text-4xl font-semibold tracking-tight">{p.priceMonthly === 0 ? "0 DA" : formatDZD(p.priceMonthly)}<span className={`text-sm font-normal ${p.highlight ? "text-white/60" : "text-zinc-500"}`}> /mois</span></p>
              <p className={`mt-1 text-sm ${p.highlight ? "text-white/60" : "text-zinc-500"}`}>{p.description}</p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {p.features.map((f) => <li key={f} className="flex items-start gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.highlight ? "text-brand" : "text-emerald-600"}`} /> {f}</li>)}
              </ul>
              <Link href="/signup" className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-semibold transition ${p.highlight ? "bg-white text-ink hover:bg-zinc-100" : "bg-ink text-white hover:bg-zinc-800"}`}>Commencer</Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-zinc-500 md:flex-row">
          <p className="flex items-center gap-2"><img src="/logo.svg" alt="ORDELY" className="h-5 w-auto" /> · Le Shopify du COD, né à Alger.</p>
          <div className="flex gap-6"><a href="#templates">Templates</a><a href="#pricing">Tarifs</a><Link href="/login">Connexion</Link></div>
        </div>
      </footer>
    </div>
  );
}
