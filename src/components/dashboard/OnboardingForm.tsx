"use client";

import { useActionState, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { createStoreAction } from "@/lib/actions/store";
import { TEMPLATES } from "@/lib/templates";
import { slugify, cn, rootDomain } from "@/lib/utils";
import { TemplatePreview } from "./TemplatePreview";

export function OnboardingForm() {
  const [state, action, pending] = useActionState(createStoreAction, null);
  const [name, setName] = useState("");
  const [sub, setSub] = useState("");
  const [subTouched, setSubTouched] = useState(false);
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const subdomain = subTouched ? sub : slugify(name).replace(/-+/g, "-");

  return (
    <form action={action} className="space-y-10">
      <section className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="db-label" htmlFor="name">Nom de la marque</label>
          <input id="name" name="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className="db-input !py-2.5" placeholder="Maison Yasmine" />
        </div>
        <div>
          <label className="db-label" htmlFor="subdomain">Adresse de la boutique</label>
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white shadow-sm focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10">
            <input id="subdomain" name="subdomain" required value={subdomain} onChange={(e) => { setSubTouched(true); setSub(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }} className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" placeholder="maison-yasmine" />
            <span className="whitespace-nowrap border-l border-zinc-200 px-3 text-xs text-zinc-500">.{rootDomain().split(":")[0]}</span>
          </div>
        </div>
        <div>
          <label className="db-label" htmlFor="phone">Téléphone / WhatsApp (affiché aux clients)</label>
          <input id="phone" name="phone" inputMode="tel" className="db-input !py-2.5" placeholder="0550 00 00 00" />
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
          <input type="checkbox" name="seed" defaultChecked className="mt-0.5 h-4 w-4 accent-zinc-900" />
          <span className="text-sm">
            <span className="font-medium">Pré-remplir avec 3 produits exemples</span>
            <span className="block text-xs text-zinc-500">Pour voir votre boutique vivante immédiatement. Modifiables ou supprimables.</span>
          </span>
        </label>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-base font-semibold">Choisissez votre univers</h2>
            <p className="text-sm text-zinc-500">Vous pourrez en changer à tout moment et personnaliser couleurs & typographies.</p>
          </div>
        </div>
        <input type="hidden" name="template" value={template} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => {
            const on = t.id === template;
            return (
              <button key={t.id} type="button" onClick={() => setTemplate(t.id)} className={cn("group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition", on ? "border-zinc-900 ring-2 ring-zinc-900/10" : "border-zinc-200 hover:border-zinc-400")}>
                <TemplatePreview t={t} />
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{t.name} <span className="ml-1 text-xs font-normal text-zinc-500">{t.vertical}</span></p>
                    <p className="mt-0.5 text-xs text-zinc-500">{t.tagline}</p>
                  </div>
                  <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300")}>
                    {on && <Check className="h-3 w-3" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {state?.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      <div className="flex items-center justify-end gap-4 border-t border-zinc-200 pt-6">
        <p className="text-xs text-zinc-500">Plan Starter gratuit · 14 jours d’essai Growth offerts</p>
        <button type="submit" disabled={pending || !subdomain} className="db-btn !px-6 !py-2.5">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Lancer ma boutique
        </button>
      </div>
    </form>
  );
}
