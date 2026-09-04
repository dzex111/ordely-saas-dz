/* Rule-based order risk scoring (no AI, no external cost).
 *
 * Signals → points (tunable weights below):
 * - phone refused history (cancelled + returned over decided) … up to +50
 * - repeat offender (≥3 total refusals) ………………………………… +10
 * - open orders on the same phone (≥3) ………………………………… +10
 * - repeat orders in 24h (≥3 → +15, ≥5 → +25)
 * - wilaya platform refusal rate ……………………………………… up to +20
 * - loyalty (≥3 delivered, 0 refused) ………………………………… −10
 * - brand-new customer ……………………………………………………… 5 (neutral, never auto-risky)
 *
 * Levels: 0–29 low · 30–59 medium · 60–100 high.
 * NEVER blocks an order — display warning to the merchant only. */

export type RiskLevel = "low" | "medium" | "high";

export type RiskInput = {
  decided: number; // delivered + cancelled + returned (same phone, same store)
  refused: number; // cancelled + returned
  delivered: number;
  open: number; // pending + confirmed + shipped
  last24h: number; // orders same phone+store in the last 24h
  wilayaRate: number; // 0..1 platform refusal rate for the wilaya
};

export type RiskResult = {
  score: number;
  level: RiskLevel;
  reasons: string[];
};

export const RISK_WEIGHTS = {
  refusal: 50,
  recidivist: 10,
  recidivistThreshold: 3,
  openOrders: 10,
  openThreshold: 3,
  repeat24hMedium: 15,
  repeat24hHigh: 25,
  repeat24hMediumThreshold: 3,
  repeat24hHighThreshold: 5,
  wilaya: 20,
  loyaltyBonus: -10,
  loyaltyDeliveredMin: 3,
  newCustomer: 5,
} as const;

export function riskLevel(score: number): RiskLevel {
  if (score < 30) return "low";
  if (score < 60) return "medium";
  return "high";
}

export function computeRisk(input: RiskInput): RiskResult {
  const reasons: string[] = [];
  const w = RISK_WEIGHTS;

  if (input.decided === 0 && input.open <= 1) {
    const score = w.newCustomer;
    return { score, level: riskLevel(score), reasons: ["Nouveau client — pas d’historique"] };
  }

  let score = 0;

  if (input.decided > 0 && input.refused > 0) {
    score += Math.round((input.refused / input.decided) * w.refusal);
    reasons.push(`${input.refused} commande(s) refusée(s) sur ${input.decided} clôturée(s)`);
  }
  if (input.refused >= w.recidivistThreshold) {
    score += w.recidivist;
    reasons.push(`${input.refused} refus au total — récidive`);
  }
  if (input.open >= w.openThreshold) {
    score += w.openOrders;
    reasons.push(`${input.open} commandes en cours sur ce numéro`);
  }
  if (input.last24h >= w.repeat24hHighThreshold) {
    score += w.repeat24hHigh;
    reasons.push(`${input.last24h} commandes en 24h — répétition suspecte`);
  } else if (input.last24h >= w.repeat24hMediumThreshold) {
    score += w.repeat24hMedium;
    reasons.push(`${input.last24h} commandes en 24h`);
  }
  const wilayaPts = Math.round(Math.min(1, Math.max(0, input.wilayaRate)) * w.wilaya);
  if (wilayaPts >= 5) {
    score += wilayaPts;
    reasons.push(`Wilaya à risque (${Math.round(input.wilayaRate * 100)} % de refus)`);
  }
  if (input.delivered >= w.loyaltyDeliveredMin && input.refused === 0) {
    score += w.loyaltyBonus;
    reasons.push(`Client fidèle (${input.delivered} livrées, 0 refus)`);
  }

  score = Math.min(100, Math.max(0, score));
  if (reasons.length === 0) reasons.push("Historique sain");
  return { score, level: riskLevel(score), reasons };
}
