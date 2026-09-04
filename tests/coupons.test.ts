import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calcDiscount, checkCoupon, couponLabel, normalizeCouponCode } from "../src/lib/coupons";

const c = (over: Record<string, unknown> = {}) => ({
  id: "x",
  storeId: "s",
  code: "WELCOME10",
  type: "percent",
  value: 10,
  minSubtotal: 0,
  maxUses: null,
  usedCount: 0,
  startsAt: null,
  endsAt: null,
  isActive: true,
  createdAt: new Date(),
  ...over,
});

describe("coupons (simple, real)", () => {
  it("normalizes codes", () => {
    assert.equal(normalizeCouponCode("  wel-come10 "), "WEL-COME10");
  });

  it("percent discount capped at subtotal, 1..90", () => {
    assert.equal(calcDiscount(c({ type: "percent", value: 10 }), 5000), 500);
    assert.equal(calcDiscount(c({ type: "percent", value: 200 }), 5000), 4500);
    assert.equal(calcDiscount(c({ type: "fixed", value: 99999 }), 3000), 3000);
    assert.equal(calcDiscount(c({ type: "fixed", value: 700 }), 5000), 700);
  });

  it("rejects inactive/expired/future/used-up/below-minimum", () => {
    assert.equal(checkCoupon(c({ isActive: false }), 5000).ok, false);
    assert.equal(checkCoupon(c({ endsAt: new Date(Date.now() - 1000) }), 5000).ok, false);
    assert.equal(checkCoupon(c({ startsAt: new Date(Date.now() + 3600_000) }), 5000).ok, false);
    assert.equal(checkCoupon(c({ maxUses: 5, usedCount: 5 }), 5000).ok, false);
    assert.equal(checkCoupon(c({ minSubtotal: 10000 }), 5000).ok, false);
    assert.equal(checkCoupon(c(), 5000).ok, true);
  });

  it("labels coupons", () => {
    assert.equal(couponLabel(c()), "WELCOME10 (−10%)");
    assert.equal(couponLabel(c({ type: "fixed", value: 500 })), "WELCOME10 (−500 DA)");
  });
});
