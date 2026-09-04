"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Merchant store ID — the merchant gives this to the admin to manage their plan. */
export function StoreIdBox({ publicId }: { publicId: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="db-card p-5 text-sm">
      <p className="font-semibold">Identifiant boutique</p>
      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2.5">
        <code className="font-mono text-sm font-semibold tracking-wider">{publicId}</code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(publicId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          aria-label="Copier l’identifiant"
          className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500">
        Donnez cet identifiant à l’admin pour changer votre plan d’abonnement.
      </p>
    </div>
  );
}
