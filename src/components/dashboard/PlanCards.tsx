"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, X } from "lucide-react";
import type { PlanId } from "@/db/schema";
import { PLANS, getPlan } from "@/lib/plans";
import { cn, formatDZD } from "@/lib/utils";

const REDIRECT_SECONDS = 8;

export function PlanCards({ current }: { current: PlanId }) {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanId | null>(null);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!selected) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push(`/contact?plan=${selected}&source=plan`);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selected, router]);

  const plan = selected ? getPlan(selected) : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const active = p.id === current;
          return (
            <div key={p.id} className={cn("relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm", p.highlight ? "border-zinc-900 shadow-xl" : "border-zinc-200")}>
              {p.badge && <span className="absolute -top-2.5 left-6 rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">{p.badge}</span>}
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{p.priceMonthly === 0 ? "0 DA" : formatDZD(p.priceMonthly)}<span className="text-sm font-normal text-zinc-500"> /mois</span></p>
              <p className="text-xs text-zinc-500">{p.description}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}</li>)}
              </ul>
              <button
                type="button"
                disabled={active}
                onClick={() => {
                  setSelected(p.id);
                  setCountdown(REDIRECT_SECONDS);
                }}
                className={cn("mt-6 w-full", active ? "db-btn-secondary" : "db-btn")}
              >
                {active ? "Plan actuel" : p.cta}
              </button>
            </div>
          );
        })}
      </div>

      {plan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Changement de plan">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Fermer"
              className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900">
              <ShieldCheck className="h-5 w-5 text-white" strokeWidth={1.9} />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">Passer au plan {plan.name} ?</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Pour changer de plan, contactez l’admin via le formulaire de contact.
              Votre plan actuel reste actif — <span className="font-medium text-zinc-900">rien ne change sans validation manuelle.</span>
            </p>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-900 transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / REDIRECT_SECONDS) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">Redirection vers le contact dans {countdown} s…</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => router.push(`/contact?plan=${plan.id}&source=plan`)} className="db-btn flex-1">
                Aller au contact
              </button>
              <button type="button" onClick={() => setSelected(null)} className="db-btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
