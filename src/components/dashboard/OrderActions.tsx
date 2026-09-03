"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { OrderStatus } from "@/db/schema";
import { updateOrderNoteAction, updateOrderStatusAction } from "@/lib/actions/orders";
import { ORDER_TRANSITIONS, STATUS_META } from "@/lib/commerce";
import { cn } from "@/lib/utils";
import { Notice } from "./ui";

export function OrderActions({ orderId, status, internalNote }: { orderId: string; status: OrderStatus; internalNote: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  const [noteState, noteAction, notePending] = useActionState(updateOrderNoteAction.bind(null, orderId), null);
  const next = ORDER_TRANSITIONS[status];

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Prochaine étape</p>
        {next.length === 0 ? (
          <p className="text-sm text-zinc-500">Commande clôturée.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {next.map((s) => {
              const danger = s === "cancelled" || s === "returned";
              return (
                <button key={s} type="button" disabled={pending} onClick={() => start(async () => setResult(await updateOrderStatusAction(orderId, s)))} className={cn(danger ? "db-btn-danger" : "db-btn")}>
                  {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {STATUS_META[s].verb}
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-3"><Notice state={result} /></div>
      </div>
      <form action={noteAction} className="space-y-2">
        <label className="db-label" htmlFor="internalNote">Note interne (invisible pour le client)</label>
        <textarea id="internalNote" name="internalNote" defaultValue={internalNote} rows={3} className="db-input" placeholder="Ex : client joignable après 17h, livrer au bureau…" />
        <div className="flex items-center justify-between">
          <Notice state={noteState} />
          <button type="submit" disabled={notePending} className="db-btn-secondary ml-auto">{notePending ? "…" : "Enregistrer la note"}</button>
        </div>
      </form>
    </div>
  );
}
