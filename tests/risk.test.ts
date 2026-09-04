import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeRisk, riskLevel, RISK_WEIGHTS } from "../src/lib/risk";

const base = { decided: 0, refused: 0, delivered: 0, open: 0, last24h: 0, wilayaRate: 0 };

describe("risk scoring (warning only, never blocks)", () => {
  it("brand-new customer is neutral low, never auto-risky", () => {
    const r = computeRisk({ ...base });
    assert.equal(r.score, RISK_WEIGHTS.newCustomer);
    assert.equal(r.level, "low");
  });

  it("all-refused history scores high", () => {
    const r = computeRisk({ ...base, decided: 4, refused: 4 });
    assert.ok(r.score >= 60, `got ${r.score}`);
    assert.equal(r.level, "high");
  });

  it("loyal customer (3+ delivered, 0 refused) scores low", () => {
    const r = computeRisk({ ...base, decided: 5, delivered: 5, open: 1, last24h: 1 });
    assert.equal(r.level, "low");
    assert.ok(r.reasons.some((x) => x.includes("fidèle")));
  });

  it("repeat orders in 24h add risk", () => {
    const a = computeRisk({ ...base, decided: 2, open: 1, last24h: 1 });
    const b = computeRisk({ ...base, decided: 2, open: 1, last24h: 4 });
    const c = computeRisk({ ...base, decided: 2, open: 1, last24h: 6 });
    assert.ok(b.score > a.score && c.score > b.score);
  });

  it("high-risk wilaya adds up to +20", () => {
    const a = computeRisk({ ...base, decided: 1, wilayaRate: 0 });
    const b = computeRisk({ ...base, decided: 1, wilayaRate: 0.8 });
    assert.equal(b.score - a.score, Math.round(0.8 * RISK_WEIGHTS.wilaya));
  });

  it("score clamps to 0..100 and levels match bands", () => {
    const r = computeRisk({ decided: 10, refused: 10, delivered: 0, open: 9, last24h: 9, wilayaRate: 1 });
    assert.ok(r.score <= 100 && r.score >= 60);
    assert.equal(riskLevel(0), "low");
    assert.equal(riskLevel(29), "low");
    assert.equal(riskLevel(30), "medium");
    assert.equal(riskLevel(59), "medium");
    assert.equal(riskLevel(60), "high");
    assert.equal(riskLevel(100), "high");
  });
});
