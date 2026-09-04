"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackagePlus, Printer, RefreshCw, Truck, XCircle } from "lucide-react";
import { cancelShipmentAction, createShipmentAction, refreshShipmentAction } from "@/lib/actions/shipping";
import type { FormState } from "@/lib/actions/auth";
import { providerLabel } from "@/lib/shipping";
import type { Shipment } from "@/db/schema";

const STATUS_FR: Record<string, { label: string; cls: string }> = {
  created: { label: "Créée", cls: "bg-zinc-100 text-zinc-700" },
  picked: { label: "Ramassée", cls: "bg-sky-50 text-sky-700" },
  transit: { label: "En transit", cls: "bg-amber-50 text-amber-800" },
  delivered: { label: "Livrée", cls: "bg-emerald-50 text-emerald-700" },
  returned: { label: "Retournée", cls: "bg-orange-50 text-orange-700" },
  cancelled: { label: "Annulée", cls: "bg-zinc-100 text-zinc-500" },
  failed: { label: "Échouée", cls: "bg-rose-50 text-rose-700" },
  unknown: { label: "Inconnu", cls: "bg-zinc-100 text-zinc-500" },
};

export type ShipmentCredOption = { id: string; provider: string; company: string | null; label: string };

/** Unified merchant UI: courier → create → tracking number → status. */
export function ShippingCard({ orderId, shipment, creds }: { orderId: string; shipment: Shipment | null; creds: ShipmentCredOption[] }) {
  const [busy, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<FormState>) =>
    start(async () => {
      const r = await fn();
      if (r && "error" in r && r.error) alert(r.error);
      router.refresh();
    });

  const st = shipment ? (STATUS_FR[shipment.status] ?? STATUS_FR.unknown) : null;

  return (
    <div className="db-card p-5">
      <p className="flex items-center gap-2 text-sm font-semibold"><Truck className="h-4 w-4" /> Expédition</p>

      {!shipment ? (
        creds.length === 0 ? (
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            Connectez un transporteur depuis <a href="/dashboard/settings" className="font-medium text-zinc-900 underline underline-offset-2">Paramètres → Expédition</a>, puis créez l’expédition en un clic.
          </p>
        ) : (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const id = (new FormData(e.currentTarget).get("cred") as string) || creds[0]?.id;
              if (id) run(() => createShipmentAction(orderId, id));
            }}
          >
            <select name="cred" defaultValue={creds[0]?.id} className="db-input" aria-label="Transporteur">
              {creds.map((c) => (
                <option key={c.id} value={c.id}>
                  {providerLabel(c.provider)}{c.company ? ` · ${c.company}` : ""} — {c.label}
                </option>
              ))}
            </select>
            <button disabled={busy} className="db-btn shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />} Créer
            </button>
          </form>
        )
      ) : (
        <div className="mt-3 space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Transporteur</span>
            <span className="font-medium">{providerLabel(shipment.provider)}{shipment.company ? ` · ${shipment.company}` : ""}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-zinc-500">N° de suivi</span>
            <code className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs font-semibold" dir="ltr">{shipment.trackingNumber}</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Statut</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st!.cls}`}>{st!.label}</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" disabled={busy} onClick={() => run(() => refreshShipmentAction(shipment.id))} className="db-btn-secondary !py-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Actualiser
            </button>
            {shipment.labelUrl && (
              <a href={shipment.labelUrl} target="_blank" rel="noreferrer" className="db-btn-secondary !py-1.5 text-xs">
                <Printer className="h-3.5 w-3.5" /> Bordereau
              </a>
            )}
            {shipment.status !== "cancelled" && shipment.status !== "delivered" && (
              <button type="button" disabled={busy} onClick={() => { if (confirm("Annuler l’expédition chez le transporteur ?")) run(() => cancelShipmentAction(shipment.id)); }} className="db-btn-danger !py-1.5 text-xs">
                <XCircle className="h-3.5 w-3.5" /> Annuler
              </button>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-400">ORDELY gère et suit — le transport est payé à votre transporteur, pas à ORDELY.</p>
        </div>
      )}
    </div>
  );
}
