"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2, Lock, Minus, Plus, Home, Building2, CheckCircle2, Tag } from "lucide-react";
import { placeOrderAction } from "@/lib/actions/orders";
import { validateCouponAction } from "@/lib/actions/coupons";
import type { Product, StoreSettings } from "@/db/schema";
import { WILAYAS, normalizePhone } from "@/lib/algeria";
import { computeDeliveryFee } from "@/lib/commerce";
import { calcDiscount } from "@/lib/coupons";
import { formatDZD, cn } from "@/lib/utils";
import { st, storeLangOf } from "@/lib/store-i18n";

type Props = { storeId: string; product: Product; settings: StoreSettings };

export function CheckoutForm({ storeId, product, settings }: Props) {
  const [state, action, pending] = useActionState(placeOrderAction, null);
  const [key, setKey] = useState("");
  const [qty, setQty] = useState(1);
  const [wilaya, setWilaya] = useState("");
  const [type, setType] = useState<"home" | "desk">("home");
  const [phone, setPhone] = useState("");
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; type: string; value: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);
  const lang = storeLangOf(settings.language);
  const t = st(lang);
  const etaOf = (zone: "north" | "highlands" | "south") =>
    zone === "north" ? t.etaNorth : zone === "highlands" ? t.etaHighlands : t.etaSouth;

  useEffect(() => {
    // Generated client-side after mount to avoid hydration mismatch. Stable per page view → no duplicate orders.
    setKey(crypto.randomUUID());
  }, []);

  const subtotal = product.price * qty;
  const discount = coupon ? calcDiscount(coupon, subtotal) : 0;
  const fee = wilaya ? computeDeliveryFee(settings, wilaya, type, subtotal - discount) : null;
  const total = subtotal - discount + (fee ?? 0);
  const w = WILAYAS.find((x) => x.code === wilaya);
  const phoneOk = phone.length === 0 || normalizePhone(phone) !== null;
  const variant = useMemo(() => product.options.map((o) => choices[o.name] ?? "").join(" / "), [product.options, choices]);
  const variantComplete = product.options.every((o) => choices[o.name]);
  const soldOut = product.stock !== null && product.stock <= 0;
  const qtyCap = Math.min(20, settings.maxQtyPerOrder ?? 5);
  const maxQty = product.stock !== null ? Math.max(1, Math.min(qtyCap, product.stock)) : qtyCap;

  return (
    <form action={action} className="sf-card p-5 md:p-6" id="commander">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="idempotencyKey" value={key} />
      <input type="hidden" name="variant" value={variant} />
      <input type="hidden" name="qty" value={qty} />
      <input type="hidden" name="deliveryType" value={type} />
      <input type="hidden" name="couponCode" value={coupon ? coupon.code : ""} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl">{t.coTitle}</h2>
        <span className="flex items-center gap-1.5 text-[11px] font-medium sf-muted">
          <Lock className="h-3 w-3" /> {t.coCod}
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
            <label className="mb-1.5 block text-xs font-medium sf-muted" htmlFor="name">{t.coName}</label>
            <input id="name" name="name" required minLength={3} autoComplete="name" placeholder={t.coNamePh} className="sf-input" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium sf-muted" htmlFor="phone">{t.coPhone}</label>
            <input id="phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="05 / 06 / 07 ..." value={phone} onChange={(e) => setPhone(e.target.value)} className={cn("sf-input", !phoneOk && "!border-rose-500")} />
            {!phoneOk && <p className="mt-1 text-[11px] text-rose-500">{t.coPhoneErr}</p>}
          </div>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium sf-muted" htmlFor="wilaya">{t.coWilaya}</label>
            <select id="wilaya" name="wilaya" required value={wilaya} onChange={(e) => setWilaya(e.target.value)} className="sf-input">
              <option value="">{t.coChoose}</option>
              {WILAYAS.map((x) => (
                <option key={x.code} value={x.code}>
                  {x.code} — {lang === "ar" ? x.ar : x.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium sf-muted" htmlFor="commune">{t.coCommune}</label>
            <input id="commune" name="commune" required minLength={2} placeholder={t.coCommunePh} className="sf-input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["home", "desk"] as const).map((dt) => {
            const on = type === dt;
            const Icon = dt === "home" ? Home : Building2;
            const f = wilaya ? computeDeliveryFee(settings, wilaya, dt, subtotal) : null;
            return (
              <button key={dt} type="button" onClick={() => setType(dt)} className="flex items-center gap-3 border p-3 text-left transition" style={{ borderRadius: "calc(var(--radius) * 0.6)", borderColor: on ? "var(--primary)" : "var(--border)", background: on ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "transparent" }}>
                <Icon className="h-4 w-4 shrink-0" style={{ color: on ? "var(--primary)" : "var(--muted)" }} />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{dt === "home" ? t.coHome : t.coDesk}</span>
                  <span className="block text-[11px] sf-muted">{f === null ? t.coPerWilaya : f === 0 ? t.coFree : formatDZD(f)}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium sf-muted" htmlFor="address">
            {t.coAddress} {type === "desk" && <span className="opacity-60">{t.coOptional}</span>}
          </label>
          <input id="address" name="address" required={type === "home"} placeholder={type === "home" ? t.coAddrHomePh : t.coAddrDeskPh} className="sf-input" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium sf-muted" htmlFor="couponCode">{t.coCoupon}</label>
          {coupon ? (
            <p className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
              <Tag className="h-3.5 w-3.5" /> {t.coCouponOn(coupon.code)}
              <button type="button" onClick={() => { setCoupon(null); setCouponInput(""); setCouponMsg(""); }} className="ml-auto text-xs underline underline-offset-2">×</button>
            </p>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  id="couponCode"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value); setCouponMsg(""); }}
                  placeholder={t.coCouponPh}
                  dir="ltr"
                  className="sf-input font-mono uppercase"
                />
                <button
                  type="button"
                  disabled={couponChecking || couponInput.trim().length < 3}
                  onClick={async () => {
                    setCouponChecking(true);
                    setCouponMsg("");
                    const r = await validateCouponAction(couponInput, storeId, subtotal);
                    if (r.ok) {
                      setCoupon(r.coupon);
                    } else {
                      setCouponMsg(r.error === "Code invalide." || r.error === "Code expiré." || r.error === "Code épuisé." ? t.coCouponBad : r.error);
                    }
                    setCouponChecking(false);
                  }}
                  className="sf-btn-ghost shrink-0 !py-2 text-xs"
                >
                  {couponChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t.coApply}
                </button>
              </div>
              {couponMsg && <p className="mt-1 text-[11px] text-rose-500">{couponMsg}</p>}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="flex items-center border" style={{ borderRadius: "calc(var(--radius) * 0.6)", borderColor: "var(--border)" }}>
              <button type="button" aria-label={t.coLess} onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5"><Minus className="h-3.5 w-3.5" /></button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
              <button type="button" aria-label={t.coMore} onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="p-2.5"><Plus className="h-3.5 w-3.5" /></button>
            </div>
            {qtyCap < 20 && <p className="mt-1 text-[11px] sf-muted">{t.coMaxPerOrder(qtyCap)}</p>}
          </div>
          <div className="text-right text-sm">
            <div className="flex justify-end gap-6 sf-muted"><span>{t.coSubtotal}</span><span className="tabular-nums" style={{ color: "var(--fg)" }}>{formatDZD(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-end gap-6 text-emerald-700"><span>{t.coDiscount}</span><span className="tabular-nums">−{formatDZD(discount)}</span></div>}
            <div className="flex justify-end gap-6 sf-muted"><span>{t.coDelivery}</span><span className="tabular-nums" style={{ color: "var(--fg)" }}>{fee === null ? "—" : fee === 0 ? t.coFree : formatDZD(fee)}</span></div>
            <div className="mt-1 flex justify-end gap-6 text-base font-semibold"><span>{t.coTotal}</span><span className="tabular-nums">{formatDZD(total)}</span></div>
          </div>
        </div>

        {state?.error && (
          <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending || !key || soldOut || !phoneOk || (product.options.length > 0 && !variantComplete)} className="sf-btn w-full !py-4 text-base">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {soldOut ? t.coSoldOutBtn : pending ? t.coSending : t.coOrderCta(formatDZD(total))}
        </button>
        {product.options.length > 0 && !variantComplete && <p className="text-center text-[11px] sf-muted">{t.coNeedOptions}</p>}
        <p className="text-center text-[11px] leading-relaxed sf-muted">
          {w ? t.coEtaTo(etaOf(w.zone), lang === "ar" ? w.ar : w.name) : t.coEverywhere}
          {t.coPayDriver}
          {settings.checkoutNote ? ` ${settings.checkoutNote}` : ""}
        </p>
      </div>
    </form>
  );
}
