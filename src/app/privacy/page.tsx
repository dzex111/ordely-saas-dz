import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site-contact";

export const metadata: Metadata = {
  title: "Confidentialité",
  description: "Comment ORDELY collecte, utilise et protège les données.",
};

/* Plain-language privacy page — what we actually do, nothing we don't. */
export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-900">← Retour à l’accueil</Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-zinc-500">En vigueur depuis septembre 2026 · ORDELY — Le Shopify du COD, né à Alger.</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-zinc-700">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">1. Qui traite vos données ?</h2>
            <p className="mt-2">
              ORDELY est la plateforme SaaS qui héberge des boutiques de vente avec paiement à la livraison (COD) en Algérie.
              Responsable du traitement : ORDELY — contact : <a href={SUPPORT_MAILTO} className="font-medium text-zinc-900 underline">{SUPPORT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">2. Quelles données, et pourquoi ?</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Compte marchand :</strong> nom, email, mot de passe (haché), nom et contenu de la boutique — pour créer et gérer votre compte.</li>
              <li><strong>Commandes de vos clients :</strong> nom, téléphone, wilaya, commune, adresse et détail de la commande — collectés pour <em>votre</em> compte, en qualité de prestataire technique. Vous restez responsable de ces données en tant que vendeur.</li>
              <li><strong>Messages de contact :</strong> ceux que vous nous envoyez volontairement.</li>
              <li><strong>Journaux techniques :</strong> adresses IP à des fins de lutte anti-spam et anti-fraude (limitation de débit).</li>
            </ul>
            <p className="mt-2">Nous ne vendons aucune donnée, à personne, jamais.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">3. Où sont hébergées les données ?</h2>
            <p className="mt-2">
              Base de données et authentification : Supabase (région eu-west-1, Irlande). Hébergement applicatif : Vercel.
              Les médias de vos boutiques sont stockés dans un bucket dédié. Aucun outil de publicité ou de pistage tiers n’est intégré
              (à l’exception de Cloudflare Turnstile, qui vérifie silencieusement que vous n’êtes pas un robot lors des inscriptions).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">4. Combien de temps ?</h2>
            <p className="mt-2">
              Vos données sont conservées pendant la durée d’utilisation du service. La suppression d’une boutique (depuis les paramètres du
              tableau de bord) efface ses données associées. Vous pouvez demander l’accès, la correction ou la suppression de vos données
              par email — nous répondons directement, sans intermédiaire.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">5. Devoirs du marchand envers ses clients</h2>
            <p className="mt-2">
              En tant que vendeur, c’est vous qui collectez les données de vos clients via votre boutique. Vous vous engagez à ne les utiliser
              que pour traiter les commandes (confirmation, livraison, service client) et à respecter la réglementation applicable en Algérie.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">6. Questions ?</h2>
            <p className="mt-2">
              Une seule adresse pour tout : <a href={SUPPORT_MAILTO} className="font-medium text-zinc-900 underline">{SUPPORT_EMAIL}</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}