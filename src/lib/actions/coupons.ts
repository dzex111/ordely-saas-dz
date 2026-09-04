"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { denyUnless } from "@/lib/team";
import { checkCoupon, normalizeCouponCode } from "@/lib/coupons";
import type { FormState } from "./auth";

const couponSchema = z.object({
  code: z.string().trim().min(3).max(32),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().int().min(1),
  minSubtotal: z.coerce.number().int().min(0).default(0),
  maxUses: z.union([z.literal(""), z.coerce.number().int().min(1)]).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

export async function createCouponAction(_: FormState, formData: FormData): Promise<FormState> {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageProducts");
  if (denied) return { error: denied };
  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.type === "percent" && d.value > 90) return { error: "Pourcentage max : 90%." };
  const code = normalizeCouponCode(d.code);
  const dup = await db.query.coupons.findFirst({
    where: and(eq(coupons.storeId, store.id), eq(coupons.code, code)),
    columns: { id: true },
  });
  if (dup) return { error: "Ce code existe déjà." };
  const startsAt = d.startsAt ? new Date(`${d.startsAt}T00:00:00`) : null;
  const endsAt = d.endsAt ? new Date(`${d.endsAt}T23:59:59`) : null;
  if (startsAt && endsAt && endsAt < startsAt) return { error: "La fin doit être après le début." };
  await db.insert(coupons).values({
    storeId: store.id,
    code,
    type: d.type,
    value: d.value,
    minSubtotal: d.minSubtotal,
    maxUses: d.maxUses === "" || d.maxUses === undefined ? null : d.maxUses,
    startsAt,
    endsAt,
  });
  revalidatePath("/dashboard/coupons");
  return { success: `Code ${code} créé.` };
}

export async function toggleCouponAction(id: string) {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageProducts");
  if (denied) return { error: denied };
  const row = await db.query.coupons.findFirst({ where: and(eq(coupons.id, id), eq(coupons.storeId, store.id)) });
  if (!row) return { error: "Code introuvable." };
  await db.update(coupons).set({ isActive: !row.isActive }).where(eq(coupons.id, id));
  revalidatePath("/dashboard/coupons");
  return { success: row.isActive ? "Code désactivé." : "Code activé." };
}

export async function deleteCouponAction(id: string) {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageProducts");
  if (denied) return { error: denied };
  await db.delete(coupons).where(and(eq(coupons.id, id), eq(coupons.storeId, store.id)));
  revalidatePath("/dashboard/coupons");
  return { success: "Code supprimé." };
}

/** Public storefront check (no login needed) — returns only public fields. */
export async function validateCouponAction(
  code: string,
  storeId: string,
  subtotal: number,
): Promise<{ ok: true; coupon: { code: string; type: string; value: number } } | { ok: false; error: string }> {
  const row = await db.query.coupons.findFirst({
    where: and(eq(coupons.storeId, storeId), eq(coupons.code, normalizeCouponCode(code))),
  });
  const checked = checkCoupon(row ?? null, subtotal);
  if (!checked.ok) return checked;
  const { code: c, type, value } = checked.coupon;
  return { ok: true, coupon: { code: c, type, value } };
}
