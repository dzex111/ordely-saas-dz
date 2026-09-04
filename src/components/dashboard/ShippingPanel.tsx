"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Trash2, Truck, XCircle } from "lucide-react";
import { removeCredentialsAction, saveCredentialsAction } from "@/lib/actions/shipping";
import { ECOTRACK_COMPANIES, PROVIDERS, providerLabel } from "@/lib/shipping";

export type CredRow = {
  id: string;
  provider: string;
  company: string | null;
  label: string;
  ok: boolean | null;
  at: string | null;
};

/** Connect merchant-owned courier accounts (keys never leave the server). */
export function ShippingPanel({ creds, canUse }: { creds: CredRow[]; canUse: boolean }) {
  const [state, action, pending] = useActionState(saveCredentialsAction, null);
  const [provider, setProvider] = useState("yalidine");
  const [company, setCompany] = useState("dhd");
  const [busy, start] = useTransition();
  const router = useRouter();
  const def = PROVIDERS.find((p) => p.id === provider)!;
  const showBaseUrl = provider === "ecotrack" && (ECOTRACK_COMPANIES.find((c) => c.id === company)?.baseUrl == null);

  if (!canUse) {
    return (
      <div className="db-card p-5 text-sm">
        <p className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4" /> Expédition</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Connectez Yalidine, ZR ou un transporteur EcoTrack (DHD, Conexlog…) et créez vos expéditions depuis chaque commande.
        </p>
        <Link href="/dashboard/billing" className="db-btn-secondary mt-3 w-full !py-2 text-xs">Disponible sur PRO</Link>
      </div>
    );
  }

  return (
    <div className="db-card space-y-4 p-5 text-sm">
      <p className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4" /> Expédition</p>

      {creds.length > 0 && (
        <ul className="divide-y divide-zinc-100">
          {creds.map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${c.ok === true ? "bg-emerald-500" : c.ok === false ? "bg-rose-500" : "bg-zinc-300"}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{providerLabel(c.provider)}{c.company ? ` · ${c.company}` : ""}</span>
                <span className="block text-xs text-zinc-500">{c.label}</span>
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (confirm("Déconnecter ce transporteur ? (les expéditions existantes sont conservées)")) {
                    start(async () => {
                      await removeCredentialsAction(c.id);
                      router.refresh();
                    });
                  }
                }}
                aria-label="Déconnecter"
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="space-y-3 border-t border-zinc-100 pt-4">
        <div>
          <label className="db-label" htmlFor="sp-provider">Transporteur</label>
          <select id="sp-provider" name="provider" value={provider} onChange={(e) => setProvider(e.target.value)} className="db-input">
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        {provider === "ecotrack" && (
          <div>
            <label className="db-label" htmlFor="sp-company">Société</label>
            <select id="sp-company" name="company" value={company} onChange={(e) => setCompany(e.target.value)} className="db-input">
              {ECOTRACK_COMPANIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        )}
        {showBaseUrl && (
          <div>
            <label className="db-label" htmlFor="sp-baseUrl">URL API du transporteur (https://…)</label>
            <input id="sp-baseUrl" name="baseUrl" dir="ltr" placeholder="https://xxx.ecotrack.dz" className="db-input font-mono" />
          </div>
        )}
        {def.credentialFields.filter((f) => !(provider === "ecotrack" && f.key === "company")).map((f) => (
          <div key={f.key}>
            <label className="db-label" htmlFor={`sp-${f.key}`}>{f.label}</label>
            <input
              id={`sp-${f.key}`}
              name={`cred_${f.key}`}
              type={f.secret ? "password" : "text"}
              required
              autoComplete="off"
              placeholder={f.placeholder}
              dir="ltr"
              className="db-input font-mono"
            />
          </div>
        ))}
        {state?.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>}
        {state?.success && <p role="status" className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><CheckCircle2 className="h-4 w-4" />{state.success}</p>}
        {state?.info && <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">{state.info}</p>}
        <button disabled={pending} className="db-btn w-full !py-2 text-xs">
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Connecter et tester
        </button>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          La connexion est testée en direct avant enregistrement. Vos clés restent sur le serveur, liées à votre compte transporteur — ORDELY ne paie ni ne facture le transport.
        </p>
      </form>

      {!creds.some((c) => c.ok) && (
        <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Yalidine : API ID + API Token (+ wilaya d’expédition) depuis le dashboard Yalidine · ZR : Token + Key (Paramètres → Info personnelles) · EcoTrack : Bearer token depuis le dashboard de votre transporteur.
        </p>
      )}
    </div>
  );
}
