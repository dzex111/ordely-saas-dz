"use client";

import { useActionState, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteStoreAction } from "@/lib/actions/store";

/** Owner-only danger zone: permanently delete the current store. */
export function DeleteStorePanel({ storeName }: { storeName: string }) {
  const [state, action, pending] = useActionState(deleteStoreAction, null);
  const [typed, setTyped] = useState("");
  const [armed, setArmed] = useState(false);
  const match = typed.trim() === storeName;

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 text-sm">
      <p className="flex items-center gap-2 font-semibold text-rose-900"><Trash2 className="h-4 w-4" /> Zone dangereuse</p>
      <p className="mt-2 text-xs leading-relaxed text-rose-800/80">
        Supprimer <span className="font-semibold">« {storeName} »</span> efface définitivement produits, commandes, clients, équipe et historique. Irréversible.
      </p>
      {!armed ? (
        <button type="button" onClick={() => setArmed(true)} className="db-btn-danger mt-3 !py-2 text-xs">
          Supprimer cette boutique…
        </button>
      ) : (
        <form action={action} className="mt-3 space-y-2.5">
          <label className="block text-xs text-rose-800" htmlFor="delete-confirm">
            Tapez exactement <code className="rounded bg-white px-1 font-mono font-semibold">{storeName}</code> pour confirmer :
          </label>
          <input
            id="delete-confirm"
            name="confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            placeholder={storeName}
            className="db-input !border-rose-200"
          />
          {state?.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending || !match} className="db-btn-danger flex-1 !py-2 text-xs disabled:opacity-40">
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Supprimer définitivement
            </button>
            <button type="button" onClick={() => { setArmed(false); setTyped(""); }} className="db-btn-secondary !py-2 text-xs">
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
