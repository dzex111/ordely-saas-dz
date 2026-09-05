"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, Trash2 } from "lucide-react";
import { createCouponAction, deleteCouponAction, toggleCouponAction } from "@/lib/actions/coupons";
import { cn } from "@/lib/utils";

export type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

export function CouponsPanel({ rows }: { rows: CouponRow[] }) {
  const [state, action, pending] = useActionState(createCouponAction, null);
  const [busy, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) => start(async () => {
    await fn();
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <div className="db-card p-5">
        <p className="text-sm font-semibold">Nouveau code</p>
        <form action={action} className="mt-3 grid gap-3 md:grid-cols-[140px_130px_110px_130px_130px_auto]">
          <input name="code" required minLength={3} maxLength={32} placeholder="WELCOME10" dir="ltr" className="db-input font-mono uppercase" />
          <select name="type" defaultValue="percent" className="db-input" aria-label="Type">
            <option value="percent">% Pourcent</option>
            <option value="fixed">DA Fixe</option>
          </select>
          <input name="value" type="number" min={1} required placeholder="Valeur" className="db-input" aria-label="Valeur" />
          <div className="relative">
            <input name="minSubtotal" type="number" min={0} placeholder="Min DA" className="db-input w-full" aria-label="Panier min (DA)" title="Montant minimum du panier pour que le code s'applique." />
          </div>
          <input name="maxUses" type="number" min={1} placeholder="Usages max (∞)" className="db-input" aria-label="Usages max" title="Nombre d’utilisations autorisées (laissez vide = illimité)." />
          <input name="startsAt" type="date" className="db-input" aria-label="Début (optionnel)" title="Début (optionnel)" />
          <input name="endsAt" type="date" className="db-input" aria-label="Fin (optionnel)" title="Fin (optionnel)" />
          <button disabled={pending} className="db-btn md:col-span-1">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Créer
          </button>
        </form>
        {state?.error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
        {state?.success && <p role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>}
        <p className="mt-2 text-[11px] text-zinc-400">Dates optionnelles : laissez vide pour un code permanent. Ex : code Ramadan du 1er au 30.</p>
      </div>

      <div className="db-card overflow-hidden">
        <div className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold">Codes ({rows.length})</div>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">Aucun code. Créez WELCOME10 pour vos premiers clients.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {rows.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <code className="rounded bg-zinc-100 px-2 py-0.5 font-mono font-semibold" dir="ltr">{c.code}</code>
                <span className="text-zinc-600">{c.type === "percent" ? `−${c.value}%` : `−${c.value} DA`}{c.minSubtotal > 0 ? ` · min ${c.minSubtotal} DA` : ""}</span>
                <span className="text-xs text-zinc-400">{c.usedCount}{c.maxUses !== null ? `/${c.maxUses}` : ""} utilisé(s){c.endsAt ? ` · jusqu’au ${c.endsAt.slice(0, 10)}` : ""}</span>
                <span className="ml-auto flex items-center gap-1">
                  <button type="button" disabled={busy} onClick={() => run(() => toggleCouponAction(c.id))} aria-label="Activer/désactiver" className={cn("rounded-lg p-1.5 transition", c.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-zinc-300 hover:bg-zinc-100")}>
                    <Power className="h-4 w-4" />
                  </button>
                  <button type="button" disabled={busy} onClick={() => { if (confirm(`Supprimer ${c.code} ?`)) run(() => deleteCouponAction(c.id)); }} aria-label="Supprimer" className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
