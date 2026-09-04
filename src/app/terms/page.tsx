import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site-contact";

export const metadata: Metadata = {
  title: "Conditions d’utilisation",
  description: "Les règles simples qui encadrent l’utilisation d’ORDELY.",
};

/* Plain-language terms — honest about what ORDELY is and is not. */
export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-900">← Retour à l’accueil</Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Conditions d’utilisation</h1>
        <p className="mt-2 text-sm text-zinc-500">En vigueur depuis septembre 2026 · ORDELY — Le Shopify du COD, né à Alger.</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-zinc-700">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">1. Le service</h2>
            <p className="mt-2">
              ORDELY fournit une plateforme technique pour créer une boutique en ligne et recevoir des commandes avec paiement à la
              livraison (COD) en Algérie. ORDELY est un <strong>prestataire technique</strong> : le vendeur, c’est vous. ORDELY n’est
              ni le vendeur, ni le transporteur, ni le encaisseur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">2. Comptes et abonnements</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Le plan Starter est gratuit. Les plans payants s’activent <strong>manuellement par l’administrateur</strong> après votre demande (page Contact) — aucun prélèvement automatique.</li>
              <li>Les prix sont affichés en dinars algériens (DA/mois). Un changement de plan se fait par simple demande.</li>
              <li>Les limites de chaque plan (produits, commandes, utilisateurs) sont appliquées automatiquement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">3. Vos engagements en tant que marchand</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Ne vendre que des produits légaux, avec des informations exactes (prix, photos, délais).</li>
              <li>Honorer les commandes confirmées et traiter correctement vos clients — votre réputation est la vôtre.</li>
              <li>Livrer via <strong>vos propres comptes transporteurs</strong> (Yalidine, ZR, EcoTrack…). ORDELY ne paie jamais la livraison et ne manipule jamais vos colis ; la plateforme ne fait que gérer et suivre.</li>
              <li>Le paiement COD est encaissé par le transporteur pour votre compte : tout litige financier avec un client ou un transporteur vous concerne directement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">4. Ce que nous interdisons</h2>
            <p className="mt-2">
              Produits illégaux, contrefaçons, fausses promesses, spam, tentative de contourner les limites ou de perturber la plateforme.
              Le non-respect entraîne la suspension de la boutique (avec notification), voire sa suppression.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">5. Disponibilité et responsabilité</h2>
            <p className="mt-2">
              Nous faisons notre possible pour un service fiable, mais aucune disponibilité n’est garantie à 100 % (maintenance, pannes
              de nos fournisseurs d’infrastructure). ORDELY ne peut être tenu responsable des pertes commerciales, des litiges avec vos
              clients ou vos transporteurs, ni des décisions de livraison prises par ces derniers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">6. Résiliation</h2>
            <p className="mt-2">
              Vous pouvez supprimer votre boutique à tout moment depuis les paramètres du tableau de bord (suppression définitive de ses
              données associées). Nous pouvons suspendre un compte qui viole ces conditions, après notification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">7. Évolution et droit applicable</h2>
            <p className="mt-2">
              Le service évolue : certaines fonctionnalités marquées « bientôt » ne sont pas encore disponibles — nous ne les facturons pas
              tant qu’elles ne le sont pas. Ces conditions sont soumises au droit algérien. Contact :{" "}
              <a href={SUPPORT_MAILTO} className="font-medium text-zinc-900 underline">{SUPPORT_EMAIL}</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}