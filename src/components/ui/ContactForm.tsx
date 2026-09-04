"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { createContactRequestAction } from "@/lib/actions/contact";
import { Turnstile } from "@/components/ui/Turnstile";
import { PLANS } from "@/lib/plans";

export function ContactForm({ defaultPlan, source }: { defaultPlan: string; source: "plan" | "contact" }) {
  const [state, action, pending] = useActionState(createContactRequestAction, null);
  const turnstileOn = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [human, setHuman] = useState(!turnstileOn);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="db-label" htmlFor="name">Votre nom</label>
          <input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" className="db-input" placeholder="Amina Benali" />
        </div>
        <div>
          <label className="db-label" htmlFor="contact">Email ou téléphone</label>
          <input id="contact" name="contact" required minLength={5} maxLength={120} autoComplete="email" className="db-input" placeholder="vous@marque.dz / 0550…" />
        </div>
      </div>
      <div>
        <label className="db-label" htmlFor="plan">Plan souhaité</label>
        <select id="plan" name="plan" defaultValue={defaultPlan} className="db-input">
          {PLANS.map((p) => (
            <option key={p.id} value={p.id}>{p.name} — {p.priceMonthly === 0 ? "0 DA" : `${p.priceMonthly.toLocaleString("fr-DZ")} DA / mois`}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="db-label" htmlFor="message">Message (optionnel)</label>
          <textarea id="message" name="message" rows={4} maxLength={1000} className="db-input" placeholder="Ex : je veux passer au plan PRO pour ma boutique…" />
      </div>
      {state?.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      {state?.success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>}
      <input type="hidden" name="source" value={source} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <Turnstile onVerify={setHuman} />
      <button type="submit" disabled={pending || !human} className="db-btn w-full !py-2.5">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Envoyer la demande
      </button>
    </form>
  );
}
