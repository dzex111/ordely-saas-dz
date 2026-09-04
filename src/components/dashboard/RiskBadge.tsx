import { ShieldAlert, ShieldCheck, ShieldHalf } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskResult } from "@/lib/risk";

/** Small risk pill (warning display only — never blocks). */
export function RiskBadge({ risk, showScore = true }: { risk: RiskResult; showScore?: boolean }) {
  const meta =
    risk.level === "high"
      ? { label: "Risque élevé", cls: "bg-rose-50 text-rose-700 ring-rose-200", Icon: ShieldAlert }
      : risk.level === "medium"
        ? { label: "Risque moyen", cls: "bg-amber-50 text-amber-800 ring-amber-200", Icon: ShieldHalf }
        : { label: "Risque faible", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", Icon: ShieldCheck };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1", meta.cls)} title={risk.reasons.join(" · ")}>
      <meta.Icon className="h-3 w-3" />
      {meta.label}
      {showScore && <span className="tabular-nums opacity-70">{risk.score}</span>}
    </span>
  );
}

/** Full risk card for the order detail page. */
export function RiskCard({ risk }: { risk: RiskResult }) {
  return (
    <div className="db-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Risque de refus</p>
        <RiskBadge risk={risk} />
      </div>
      <ul className="mt-3 space-y-1.5">
        {risk.reasons.map((r) => (
          <li key={r} className="text-xs leading-relaxed text-zinc-600">• {r}</li>
        ))}
      </ul>
      <p className="mt-3 border-t border-zinc-100 pt-2 text-[11px] leading-relaxed text-zinc-400">
        Indicatif uniquement — basé sur l’historique du numéro et de la wilaya. Ne bloque jamais la commande.
      </p>
    </div>
  );
}
