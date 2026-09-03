import Link from "next/link";
import { ContactForm } from "@/components/ui/ContactForm";
import { PLAN_IDS, type PlanId } from "@/db/schema";

export const metadata = { title: "Contact" };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const defaultPlan: PlanId = (PLAN_IDS as readonly string[]).includes(plan ?? "") ? (plan as PlanId) : "growth";
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-zinc-200/60 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="ORDELY - home"><img src="/logo.svg" alt="ORDELY" className="h-6 w-auto" /></Link>
          <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-ink">Tableau de bord</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand">Contact admin</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Changer de plan ? On s’en occupe.</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
          Les changements de plan sont validés manuellement par l’admin après paiement.
          Remplissez ce formulaire — votre plan actuel reste actif, rien ne change sans validation.
        </p>
        <div className="db-card mt-8 p-6 md:p-8">
          <ContactForm defaultPlan={defaultPlan} />
        </div>
      </main>
    </div>
  );
}
