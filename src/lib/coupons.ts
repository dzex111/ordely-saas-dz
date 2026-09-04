import type { Coupon } from "@/db/schema";

/** Normalize user-typed codes: trimmed + uppercase. */
export function normalizeCouponCode(raw: string): string {
  return (raw ?? "").trim().toUpperCase().slice(0, 32);
}

export type CouponCheck =
  | { ok: true; coupon: Coupon }
  | { ok: false; error: string };

/** Validate a coupon against subtotal + time window + usage cap. */
export function checkCoupon(
  coupon: Coupon | null | undefined,
  subtotal: number,
  now: Date = new Date(),
  lang: "fr" | "ar" = "fr",
): CouponCheck {
  const ar = lang === "ar";
  if (!coupon || !coupon.isActive) return { ok: false, error: ar ? "كود غير صالح." : "Code invalide." };
  if (coupon.startsAt && now < coupon.startsAt) return { ok: false, error: ar ? "الكود غير صالح بعد." : "Code pas encore valide." };
  if (coupon.endsAt && now > coupon.endsAt) return { ok: false, error: ar ? "انتهت صلاحية الكود." : "Code expiré." };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { ok: false, error: ar ? "نفد الكود." : "Code épuisé." };
  if (subtotal < coupon.minSubtotal)
    return { ok: false, error: ar ? `الحد الأدنى ${coupon.minSubtotal} DA لهذا الكود.` : `Minimum ${coupon.minSubtotal} DA pour ce code.` };
  return { ok: true, coupon };
}

/** DZD discount for a VALID coupon (pure — same math client + server). */
export function calcDiscount(coupon: Pick<Coupon, "type" | "value">, subtotal: number): number {
  if (coupon.type === "percent") {
    const pct = Math.min(90, Math.max(1, coupon.value));
    return Math.min(subtotal, Math.round((subtotal * pct) / 100));
  }
  return Math.min(subtotal, Math.max(0, coupon.value));
}

export function couponLabel(coupon: Pick<Coupon, "code" | "type" | "value">): string {
  return coupon.type === "percent" ? `${coupon.code} (−${coupon.value}%)` : `${coupon.code} (−${coupon.value} DA)`;
}
