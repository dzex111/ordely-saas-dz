"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2, Lock, Minus, Plus, Home, Building2, CheckCircle2 } from "lucide-react";
import { placeOrderAction } from "@/lib/actions/orders";
import type { Product, StoreSettings } from "@/db/schema";
import { WILAYAS, ZONE_ETA, normalizePhone } from "@/lib/algeria";
import { computeDeliveryFee } from "@/lib/commerce";
import { formatDZD, cn } from "@/lib/utils";

type Props = { storeId: string; product: Product; settings: StoreSettings };

export function CheckoutForm({ storeId, product, settings }: Props) {
  const [state, action, pending] = useActionState(placeOrderAction, null);
  const [key, setKey] = useState("");
  const [qty, setQty] = useState(1);
  const [wilaya, setWilaya] = useState("");
  const [type, setType] = useState<"home" | "desk">("home");
  const [phone, setPhone] = useState("");
  const [choices, setChoices] = useState<Record<string, string>>({});

  useEffect(() => {
    // Generated client-side after mount to avoid hydration mismatch. Stable per page view → no duplicate orders.
    setKey(crypto.randomUUID());
  }, []);

  const subtotal = product.price * qty;
  const fee = wilaya ? computeDeliveryFee(settings, wilaya, type, subtotal) : null;
  const total = subtotal + (fee ?? 0);
  const w = WILAYAS.find((x) => x.code === wilaya);
  const phoneOk = phone.length === 0 || normalizePhone(phone) !== null;
  const variant = useMemo(() => product.options.map((o) => choices[o.name] ?? "").join(" / "), [product.options, choices]);
  const variantComplete = product.options.every((o) => choices[o.name]);
  const soldOut = product.stock !== null && product.stock <= 0;
  const maxQty = product.stock !== null ? Math.max(1, Math.min(20, product.stock)) : 20;

  return (
    <form action={action} className="sf-card p-5 md:p-6" id="commander">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="idempotencyKey" value={key} />
      <input type="hidden" name="variant" value={variant} />
      <input type="hidden" name="qty" value={qty} />
      <input type="hidden" name="deliveryType" value={type} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl">Commander maintenant</h2>
        <span className="flex items-center gap-1.5 text-[11px] font-medium sf-muted">
          <Lock className="h-3 w-3" /> Paiement à la livraison
        </span>
      </div>

      {product.options.length > 0 && (
        <div className="mb-5 space-y-4">
          {product.options.map((opt) => (
            <div key={opt.name}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider sf-muted">
                {opt.name} {choices[opt.name] && <span className="normal-case tracking-normal" style={{ color: "var(--fg)" }}>· {choices[opt.name]}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((val) => {
                  const on = choices[opt.name] === val;
                  return (
                    <button key={val} type="button" onClick={() => setChoices((c) => ({ ...c, [opt.name]: val }))} className="min-w-11 border px-3.5 py-2 text-sm font-medium transition" style={{ borderRadius: "calc(var(--radius) * 0.6)", borderColor: on ? "var(--primary)" : "var(--border)", background: on ? "var(--primary)" : "transparent", color: on ? "var(--primary-fg)" : "var(--fg)" }}>
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3.5">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium sf-muted" htmlFor="name">Nom complet</label>
            <input id="name" name="name" required minLength={3} autoComplete="name" placeholder="Prénom et nom" className="sf-input" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium sf-muted" htmlFor="phone">Téléphone</label>
            <input id="phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="05 / 06 / 07 ..." value={phone} onChange={(e) => setPhone(e.target.value)} className={cn("sf-input", !phoneOk && "!border-rose-500")} />
            {!phoneOk && <p className="mt-1 text-[11px] text-rose-500">Format : 05, 06 ou 07 + 8 chiffres</p>}
          </div>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium sf-muted" htmlFor="wilaya">Wilaya</label>
            <select id="wilaya" name="wilaya" required value={wilaya} onChange={(e) => setWilaya(e.target.value)} className="sf-input">
              <option value="">Choisir…</option>
              {WILAYAS.map((x) => (
                <option key={x.code} value={x.code}>
                  {x.code} — {x.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium sf-muted" htmlFor="commune">Commune</label>
            <input id="commune" name="commune" required minLength={2} placeholder="Votre commune / baladiya" className="sf-input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["home", "desk"] as const).map((t) => {
            const on = type === t;
            const Icon = t === "home" ? Home : Building2;
            const f = wilaya ? computeDeliveryFee(settings, wilaya, t, subtotal) : null;
            return (
              <button key={t} type="button" onClick={() => setType(t)} className="flex items-center gap-3 border p-3 text-left transition" style={{ borderRadius: "calc(var(--radius) * 0.6)", borderColor: on ? "var(--primary)" : "var(--border)", background: on ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "transparent" }}>
                <Icon className="h-4 w-4 shrink-0" style={{ color: on ? "var(--primary)" : "var(--muted)" }} />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{t === "home" ? "À domicile" : "Point relais"}</span>
                  <span className="block text-[11px] sf-muted">{f === null ? "Selon wilaya" : f === 0 ? "Offerte" : formatDZD(f)}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium sf-muted" htmlFor="address">
            Adresse {type === "desk" && <span className="opacity-60">(facultatif)</span>}
          </label>
          <input id="address" name="address" required={type === "home"} placeholder={type === "home" ? "Rue, numéro, repère…" : "Bureau du transporteur le plus proche"} className="sf-input" />
        </div>

        <div className="flex items-center justify-between gap-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center border" style={{ borderRadius: "calc(var(--radius) * 0.6)", borderColor: "var(--border)" }}>
            <button type="button" aria-label="Moins" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5"><Minus className="h-3.5 w-3.5" /></button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
            <button type="button" aria-label="Plus" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="p-2.5"><Plus className="h-3.5 w-3.5" /></button>
          </div>
          <div className="text-right text-sm">
            <div className="flex justify-end gap-6 sf-muted"><span>Sous-total</span><span className="tabular-nums" style={{ color: "var(--fg)" }}>{formatDZD(subtotal)}</span></div>
            <div className="flex justify-end gap-6 sf-muted"><span>Livraison</span><span className="tabular-nums" style={{ color: "var(--fg)" }}>{fee === null ? "—" : fee === 0 ? "Offerte" : formatDZD(fee)}</span></div>
            <div className="mt-1 flex justify-end gap-6 text-base font-semibold"><span>Total</span><span className="tabular-nums">{formatDZD(total)}</span></div>
          </div>
        </div>

        {state?.error && (
          <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending || !key || soldOut || !phoneOk || (product.options.length > 0 && !variantComplete)} className="sf-btn w-full !py-4 text-base">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {soldOut ? "Épuisé" : pending ? "Envoi de la commande…" : `Commander · ${formatDZD(total)}`}
        </button>
        {product.options.length > 0 && !variantComplete && <p className="text-center text-[11px] sf-muted">Choisissez vos options pour continuer</p>}
        <p className="text-center text-[11px] leading-relaxed sf-muted">
          {w ? `Livraison ${ZONE_ETA[w.zone]} vers ${w.name}. ` : "Livraison partout en Algérie. "}
          Vous payez le livreur à la réception. Confirmation par téléphone.
          {settings.checkoutNote ? ` ${settings.checkoutNote}` : ""}
        </p>
      </div>
    </form>
  );
}
