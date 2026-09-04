"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, MessageCircle } from "lucide-react";
import { removeCustomDomainAction, saveCustomDomainAction, verifyCustomDomainAction } from "@/lib/actions/domains";
import { SUPPORT_MAILTO, SUPPORT_WHATSAPP_URL } from "@/lib/site-contact";
import { cn } from "@/lib/utils";

const STATUS: Record<string, { label: string; cls: string }> = {
  none: { label: "Non configuré", cls: "bg-zinc-100 text-zinc-600" },
  pending: { label: "En attente DNS", cls: "bg-amber-100 text-amber-800" },
  active: { label: "Actif", cls: "bg-emerald-50 text-emerald-700" },
};

/** PRO+: attach a merchant-owned hostname. 3 steps, no technical jargon. */
export function CustomDomainPanel({ domain, status, canUse }: { domain: string | null; status: string; canUse: boolean }) {
  const [state, action, pending] = useActionState(saveCustomDomainAction, null);
  const [busy, start] = useTransition();
  const router = useRouter();
  const st = STATUS[status] ?? STATUS.none;

  if (!canUse) {
    return (
      <div className="db-card p-5 text-sm">
        <p className="flex items-center gap-2 font-semibold"><Globe className="h-4 w-4" /> Domaine personnalisé</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Disponible sur PRO. Utilisez votre propre nom de domaine (ex : boutique-monsite.dz) au lieu du sous-domaine ORDELY.
        </p>
        <Link href="/dashboard/billing" className="db-btn-secondary mt-3 w-full !py-2 text-xs">Voir les plans</Link>
      </div>
    );
  }

  return (
    <div className="db-card space-y-4 p-5 text-sm">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-semibold"><Globe className="h-4 w-4" /> Domaine personnalisé</p>
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", st.cls)}>{st.label}</span>
      </div>

      {domain ? (
        <div className="space-y-3">
          <p className="truncate rounded-lg bg-zinc-50 px-3 py-2.5 font-mono text-sm font-semibold" dir="ltr">{domain}</p>
          <div className="flex gap-2">
            {status !== "active" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => start(async () => {
                  const r = await verifyCustomDomainAction();
                  if (r?.error) alert(r.error);
                  if (r?.success) alert(r.success);
                  router.refresh();
                })}
                className="db-btn flex-1 !py-2 text-xs"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Vérifier
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (confirm("Détacher ce domaine ?")) start(async () => {
                  await removeCustomDomainAction();
                  router.refresh();
                });
              }}
              className="db-btn-danger flex-1 !py-2 text-xs"
            >
              Détacher
            </button>
          </div>
        </div>
      ) : (
        <form action={action} className="space-y-3">
          <input name="domain" required maxLength={253} placeholder="boutique-monsite.dz" dir="ltr" className="db-input font-mono" />
          {state?.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>}
          {state?.success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{state.success}</p>}
          {state?.info && <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">{state.info}</p>}
          <button disabled={pending} className="db-btn w-full !py-2 text-xs">
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Ajouter mon domaine
          </button>
        </form>
      )}

      <ol className="space-y-1.5 text-xs leading-relaxed text-zinc-500">
        <li><span className="font-semibold text-zinc-700">1.</span> Ajoutez votre domaine ci-dessus.</li>
        <li><span className="font-semibold text-zinc-700">2.</span> Chez votre registrar, créez : <code dir="ltr">CNAME → cname.vercel-dns.com</code> (ou <code dir="ltr">A → 76.76.21.21</code> pour un domaine racine).</li>
        <li><span className="font-semibold text-zinc-700">3.</span> Cliquez sur « Vérifier » — le HTTPS est automatique.</li>
      </ol>
      <p className="text-xs text-zinc-500">
        Bloqué ? Écrivez-nous :{" "}
        <a href={SUPPORT_MAILTO} className="font-medium text-zinc-900 underline underline-offset-2">email</a>
        {" "}ou{" "}
        <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-zinc-900 underline underline-offset-2">
          <MessageCircle className="h-3 w-3" /> WhatsApp
        </a>
        , on vous guide pas à pas.
      </p>
    </div>
  );
}
