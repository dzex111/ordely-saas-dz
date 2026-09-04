import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import type { PlanId } from "@/db/schema";
import { getPlan, startOfBillingMonth } from "@/lib/plans";

export type AiQuota = {
  plan: PlanId;
  included: number;
  used: number;
  remaining: number;
  periodStart: Date;
};

/** Current AI quota state for a store (calendar month, Africa/Algiers). */
export async function getAiQuota(storeId: string, plan: PlanId, now: Date = new Date()): Promise<AiQuota> {
  const included = getPlan(plan).limits.aiConfirmationsPerMonth;
  const periodStart = startOfBillingMonth(now);
  const rows = await db
    .select({ used: sql<number>`coalesce(sum(${aiUsage.units}), 0)` })
    .from(aiUsage)
    .where(and(eq(aiUsage.storeId, storeId), gte(aiUsage.createdAt, periodStart)));
  const used = Number(rows[0]?.used ?? 0);
  return { plan, included, used, remaining: Math.max(0, included - used), periodStart };
}

/**
 * Consume AI units (future AI features call this BEFORE spending external cost).
 * Returns { ok } or { ok: false, error } when the included quota is exhausted.
 * Paid top-ups (+100/+500/+1000) plug in here later as extra grants — the
 * subscription architecture does not change.
 */
export async function consumeAiUnits(
  storeId: string,
  plan: PlanId,
  units = 1,
  kind = "confirmation",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const quota = await getAiQuota(storeId, plan);
  if (quota.used + units > quota.included) {
    return {
      ok: false,
      error: `Quota IA épuisé (${quota.used}/${quota.included} ce mois). Rechargez des crédits pour continuer.`,
    };
  }
  await db.insert(aiUsage).values({ storeId, kind, units });
  return { ok: true };
}
