import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeMetrics } from "../src/lib/analytics";

const o = (over: Record<string, unknown> = {}) => ({
  status: "pending",
  total: 1000,
  wilayaCode: "16",
  items: [{ productId: "p1", name: "Robe", price: 1000, qty: 1 }],
  ...over,
});

describe("store analytics (plain math, no AI)", () => {
  it("empty store yields nulls, not NaN", () => {
    const m = computeMetrics([]);
    assert.equal(m.total, 0);
    assert.equal(m.confirmRate, null);
    assert.equal(m.deliveryRate, null);
    assert.equal(m.aov, null);
    assert.deepEqual(m.topProducts, []);
  });

  it("counts + rates + revenue + AOV", () => {
    const m = computeMetrics([
      o({ status: "delivered", total: 2000 }),
      o({ status: "delivered", total: 4000 }),
      o({ status: "cancelled", total: 1000 }),
      o({ status: "pending", total: 1000 }),
    ]);
    assert.equal(m.total, 4);
    assert.equal(m.confirmed, 2);
    assert.equal(m.refused, 1);
    assert.equal(m.delivered, 2);
    assert.equal(m.confirmRate, 50);
    assert.equal(m.refuseRate, 25);
    // delivered / (delivered + cancelled + returned)
    assert.equal(m.deliveryRate, 67);
    assert.equal(m.revenue, 6000);
    assert.equal(m.aov, 3000);
  });

  it("top products ranked by revenue, top wilayas by count", () => {
    const m = computeMetrics([
      o({ items: [{ productId: "a", name: "A", price: 100, qty: 1 }], wilayaCode: "16" }),
      o({ items: [{ productId: "b", name: "B", price: 5000, qty: 2 }], wilayaCode: "31" }),
      o({ items: [{ productId: "a", name: "A", price: 100, qty: 1 }], wilayaCode: "16" }),
    ]);
    assert.equal(m.topProducts[0].name, "B");
    assert.equal(m.topProducts[0].revenue, 10000);
    assert.equal(m.topWilayas[0].code, "16");
    assert.equal(m.topWilayas[0].count, 2);
  });
});
