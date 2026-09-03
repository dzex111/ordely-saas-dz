"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import type { PlanId } from "@/db/schema";
import { changePlanAction } from "@/lib/actions/store";
import { PLANS } from "@/lib/plans";
import { cn, formatDZD } from "@/lib/utils";
import { Notice } from "./ui";

export function PlanCards({ current }: { current: PlanId }) {
  const [pending, start] = useTransition();
  const [target, setTarget] = useState<string | null>(null);
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  return (
    <div className="space-y-4">
      <Notice state={result} />
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const active = p.id === current;
          return (
            <div key={p.id} className={cn("relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm", p.highlight ? "border-zinc-900" : "border-zinc-200")}>
              {p.highlight && <span className="absolute -top-2.5 left-6 rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Populaire</span>}
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{p.priceMonthly === 0 ? "Gratuit" : formatDZD(p.priceMonthly)}<span className="text-sm font-normal text-zinc-500">{p.priceMonthly === 0 ? "" : " /mois"}</span></p>
              <p className="text-xs text-zinc-500">{p.priceUsd > 0 ? `≈ $${p.priceUsd} · ` : ""}{p.description}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}</li>)}
              </ul>
              <button type="button" disabled={active || pending} onClick={() => { setTarget(p.id); start(async () => setResult(await changePlanAction(p.id))); }} className={cn("mt-6 w-full", active ? "db-btn-secondary" : "db-btn")}>
                {pending && target === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                {active ? "Plan actuel" : p.priceMonthly === 0 ? "Repasser en Starter" : "Essayer 14 jours"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
