import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FEATURE_KEYS, PLANS, getPlan, hasFeature, nextPlan, startOfBillingMonth, upgradeCta } from "../src/lib/plans";

describe("plan catalogue (Free + PRO 499 + BUSINESS 1499)", () => {
  it("has exactly starter/pro/business, no legacy ids", () => {
    assert.deepEqual(PLANS.map((p) => p.id), ["starter", "pro", "business"]);
  });

  it("prices are 0 / 499 / 1499 DA", () => {
    assert.equal(getPlan("starter").priceMonthly, 0);
    assert.equal(getPlan("pro").priceMonthly, 499);
    assert.equal(getPlan("business").priceMonthly, 1499);
  });

  it("starter limits: 1 store, 10 products, 50 orders/mo, 1 user, 0 AI", () => {
    assert.deepEqual(getPlan("starter").limits, {
      stores: 1,
      productsPerStore: 10,
      ordersPerMonth: 50,
      users: 1,
      aiConfirmationsPerMonth: 0,
    });
  });

  it("pro limits: 1 store, 100 products, 500 orders/mo, 3 users, 100 AI", () => {
    assert.deepEqual(getPlan("pro").limits, {
      stores: 1,
      productsPerStore: 100,
      ordersPerMonth: 500,
      users: 3,
      aiConfirmationsPerMonth: 100,
    });
  });

  it("business limits: 3 stores, 500 products, 2000 orders/mo, 10 users, 500 AI", () => {
    assert.deepEqual(getPlan("business").limits, {
      stores: 3,
      productsPerStore: 500,
      ordersPerMonth: 2000,
      users: 10,
      aiConfirmationsPerMonth: 500,
    });
  });

  it("PRO is highlighted POPULAIRE", () => {
    assert.equal(getPlan("pro").highlight, true);
    assert.equal(getPlan("pro").badge, "POPULAIRE");
    assert.equal(getPlan("starter").highlight, undefined);
  });

  it("upgrade path starter -> pro -> business -> top", () => {
    assert.equal(nextPlan("starter")?.id, "pro");
    assert.equal(nextPlan("pro")?.id, "business");
    assert.equal(nextPlan("business"), null);
    assert.match(upgradeCta("starter"), /PRO.*499/);
    assert.match(upgradeCta("pro"), /BUSINESS.*1.499|BUSINESS.*1499/);
    assert.equal(upgradeCta("business"), "");
  });

  it("starter has no paid flags; business has them all", () => {
    assert.equal(hasFeature("starter", "customDomain"), false);
    assert.equal(hasFeature("starter", "aiConfirmation"), false);
    assert.equal(hasFeature("starter", "multiStore"), false);
    assert.equal(hasFeature("starter", "orderManagement"), true);
    for (const key of FEATURE_KEYS) {
      assert.equal(hasFeature("business", key), true, `business missing ${key}`);
    }
  });

  it("pro gates: domain/export/AI/shipping on, advanced off", () => {
    assert.equal(hasFeature("pro", "customDomain"), true);
    assert.equal(hasFeature("pro", "csvExport"), true);
    assert.equal(hasFeature("pro", "aiConfirmation"), true);
    assert.equal(hasFeature("pro", "shippingIntegrations"), true);
    assert.equal(hasFeature("pro", "riskScoring"), false);
    assert.equal(hasFeature("pro", "bulkShipping"), false);
    assert.equal(hasFeature("pro", "multiStore"), false);
  });
});

describe("startOfBillingMonth (Africa/Algiers, deterministic)", () => {
  it("mid-month maps to the 1st 00:00 Algiers", () => {
    // 2026-09-15T12:00:00Z = 13:00 Algiers (UTC+1) → period starts 2026-08-31T23:00:00Z
    const start = startOfBillingMonth(new Date("2026-09-15T12:00:00Z"));
    assert.equal(start.toISOString(), "2026-08-31T23:00:00.000Z");
  });

  it("month boundary follows Algiers wall time, not UTC", () => {
    // 2026-09-30T23:30Z = Oct 1 00:30 Algiers → October period
    const start = startOfBillingMonth(new Date("2026-09-30T23:30:00Z"));
    assert.equal(start.toISOString(), "2026-09-30T23:00:00.000Z");
    // 2026-09-30T22:30Z = Sep 30 23:30 Algiers → September period
    const start2 = startOfBillingMonth(new Date("2026-09-30T22:30:00Z"));
    assert.equal(start2.toISOString(), "2026-08-31T23:00:00.000Z");
  });

  it("same instants in a month share one period", () => {
    const a = startOfBillingMonth(new Date("2026-09-01T00:00:01Z")).getTime();
    const b = startOfBillingMonth(new Date("2026-09-30T22:59:59Z")).getTime();
    assert.equal(a, b);
  });
});
