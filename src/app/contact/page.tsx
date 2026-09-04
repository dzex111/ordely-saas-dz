import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/ui/ContactForm";
import { SUPPORT_EMAIL, SUPPORT_MAILTO, SUPPORT_WHATSAPP_DISPLAY, SUPPORT_WHATSAPP_URL } from "@/lib/site-contact";
import { getPlan } from "@/lib/plans";
import { PLAN_IDS, type PlanId } from "@/db/schema";

export const metadata = { title: "Contact" };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ plan?: string; source?: string }> }) {
  const { plan, source } = await searchParams;
  const defaultPlan: PlanId = (PLAN_IDS as readonly string[]).includes(plan ?? "") ? (plan as PlanId) : "pro";
  const fromPlan = source === "plan";
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-zinc-200/60 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="ORDELY - home"><img src="/logo.svg" alt="ORDELY" className="h-8 w-auto" /></Link>
          <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-ink">Tableau de bord</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand">Contact admin</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{fromPlan ? `Demande d’abonnement ${getPlan(defaultPlan).name}` : "Changer de plan ? On s’en occupe."}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
          Les changements de plan sont validés manuellement par l’admin après paiement.
          Remplissez ce formulaire — votre plan actuel reste actif, rien ne change sans validation.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <a href={SUPPORT_MAILTO} className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-zinc-50">
            <Mail className="h-4 w-4 text-zinc-500" /> {SUPPORT_EMAIL}
          </a>
          <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-zinc-50">
            <MessageCircle className="h-4 w-4 text-emerald-600" /> {SUPPORT_WHATSAPP_DISPLAY}
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">WhatsApp uniquement</span>
          </a>
        </div>
        <div className="db-card mt-8 p-6 md:p-8">
          <ContactForm defaultPlan={defaultPlan} source={fromPlan ? "plan" : "contact"} />
        </div>
      </main>
    </div>
  );
}
