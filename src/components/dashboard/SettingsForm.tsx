"use client";

import { useActionState, useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import type { Store } from "@/db/schema";
import { updateSettingsAction } from "@/lib/actions/store";
import { WILAYAS, ZONE_ETA } from "@/lib/algeria";
import { rootDomain, cn } from "@/lib/utils";
import { Notice } from "./ui";

export function SettingsForm({ store }: { store: Store }) {
  const [state, action, pending] = useActionState(updateSettingsAction, null);
  const [showRates, setShowRates] = useState(Object.keys(store.settings.rateOverrides ?? {}).length > 0);
  const s = store.settings;
  return (
    <form action={action} className="space-y-6">
      <section className="db-card space-y-4 p-5">
        <p className="text-sm font-semibold">Boutique</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="db-label" htmlFor="subdomain">Adresse</label>
            <div className="flex items-center rounded-lg border border-zinc-200 bg-white text-sm shadow-sm">
              <input id="subdomain" name="subdomain" defaultValue={store.subdomain} className="w-full bg-transparent px-3 py-2 outline-none" />
              <span className="whitespace-nowrap border-l border-zinc-200 px-3 text-xs text-zinc-500">.{rootDomain().split(":")[0]}</span>
            </div>
          </div>
          <div>
            <label className="db-label" htmlFor="language">Langue principale du contenu</label>
            <select id="language" name="language" defaultValue={s.language} className="db-input">
              <option value="fr">Français</option>
              <option value="ar">العربية (arabe)</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3">
          <input type="checkbox" name="published" defaultChecked={store.published} className="h-4 w-4 accent-zinc-900" />
          <span className="text-sm"><span className="font-medium">Boutique publiée</span><span className="block text-xs text-zinc-500">Décochez pour passer en mode privé : vous seul pouvez la voir, les visiteurs voient une page introuvable et les commandes sont bloquées.</span></span>
        </label>
      </section>

      <section className="db-card space-y-4 p-5">
        <p className="text-sm font-semibold">Livraison & retours</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="db-label" htmlFor="homeDeliveryFee">Domicile (DA)</label>
            <input id="homeDeliveryFee" name="homeDeliveryFee" type="number" min={0} required defaultValue={s.homeDeliveryFee} className="db-input" />
          </div>
          <div>
            <label className="db-label" htmlFor="deskDeliveryFee">Point relais (DA)</label>
            <input id="deskDeliveryFee" name="deskDeliveryFee" type="number" min={0} required defaultValue={s.deskDeliveryFee} className="db-input" />
          </div>
          <div>
            <label className="db-label" htmlFor="freeShippingThreshold">Offerte dès (DA)</label>
            <input id="freeShippingThreshold" name="freeShippingThreshold" type="number" min={0} defaultValue={s.freeShippingThreshold ?? ""} placeholder="jamais" className="db-input" />
          </div>
          <div>
            <label className="db-label" htmlFor="returnDays">Retour (jours)</label>
            <input id="returnDays" name="returnDays" type="number" min={0} max={60} required defaultValue={s.returnDays} className="db-input" />
          </div>
          <div>
            <label className="db-label" htmlFor="maxQtyPerOrder">Qté max / commande</label>
            <input id="maxQtyPerOrder" name="maxQtyPerOrder" type="number" min={1} max={20} required defaultValue={s.maxQtyPerOrder ?? 5} className="db-input" />
          </div>
        </div>
        <div>
          <label className="db-label" htmlFor="checkoutNote">Note affichée sous le bouton commander</label>
          <input id="checkoutNote" name="checkoutNote" defaultValue={s.checkoutNote ?? ""} maxLength={200} placeholder="Ex : Ouvrez le colis devant le livreur avant de payer." className="db-input" />
        </div>
        <button type="button" onClick={() => setShowRates((v) => !v)} className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
          <ChevronDown className={cn("h-4 w-4 transition", showRates && "rotate-180")} /> Tarifs spécifiques par wilaya {Object.keys(s.rateOverrides ?? {}).length > 0 && <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px]">{Object.keys(s.rateOverrides).length} personnalisés</span>}
        </button>
        {showRates && (
          <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-500">
                <tr><th className="px-3 py-2 font-medium">Wilaya</th><th className="px-3 py-2 font-medium">Délai</th><th className="px-3 py-2 font-medium">Domicile</th><th className="px-3 py-2 font-medium">Relais</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {WILAYAS.map((w) => (
                  <tr key={w.code}>
                    <td className="px-3 py-1.5">{w.code} — {w.name}</td>
                    <td className="px-3 py-1.5 text-xs text-zinc-500">{ZONE_ETA[w.zone]}</td>
                    <td className="px-3 py-1.5"><input name={`rate_home_${w.code}`} type="number" min={0} defaultValue={s.rateOverrides?.[w.code]?.home ?? ""} placeholder={String(s.homeDeliveryFee)} className="db-input !w-24 !py-1" /></td>
                    <td className="px-3 py-1.5"><input name={`rate_desk_${w.code}`} type="number" min={0} defaultValue={s.rateOverrides?.[w.code]?.desk ?? ""} placeholder={String(s.deskDeliveryFee)} className="db-input !w-24 !py-1" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between gap-3">
        <Notice state={state} />
        <button type="submit" disabled={pending} className="db-btn ml-auto">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer</button>
      </div>
    </form>
  );
}
