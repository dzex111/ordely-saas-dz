"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { createContactRequestAction } from "@/lib/actions/contact";

/** Lightweight footer contact block — same identity, posts to the admin inbox. */
export function FooterContact() {
  const [state, action, pending] = useActionState(createContactRequestAction, null);
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
      <form action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end">
        <div>
          <label className="db-label" htmlFor="footer-name">Nom</label>
          <input id="footer-name" name="name" required minLength={2} maxLength={80} autoComplete="name" className="db-input" placeholder="Votre nom" />
        </div>
        <div>
          <label className="db-label" htmlFor="footer-contact">Email ou téléphone</label>
          <input id="footer-contact" name="contact" required minLength={5} maxLength={120} className="db-input" placeholder="0550…" />
        </div>
        <div>
          <label className="db-label" htmlFor="footer-message">Message</label>
          <input id="footer-message" name="message" maxLength={1000} className="db-input" placeholder="Je veux passer au plan Growth…" />
        </div>
        <input type="hidden" name="plan" value="growth" />
        <button type="submit" disabled={pending} className="db-btn !px-5 !py-2.5" aria-label="Envoyer">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="md:hidden">Envoyer</span>
        </button>
      </form>
      {state?.error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      {state?.success && <p role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>}
    </div>
  );
}
