import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ORDER_TRANSITIONS, orderTargetFromShipment } from "../src/lib/commerce";

describe("shipping sync (daily cron)", () => {
  it("maps shipment statuses to order targets", () => {
    assert.equal(orderTargetFromShipment("picked"), "shipped");
    assert.equal(orderTargetFromShipment("transit"), "shipped");
    assert.equal(orderTargetFromShipment("delivered"), "delivered");
    assert.equal(orderTargetFromShipment("returned"), "returned");
    assert.equal(orderTargetFromShipment("created"), null);
    assert.equal(orderTargetFromShipment("cancelled"), null);
    assert.equal(orderTargetFromShipment("failed"), null);
    assert.equal(orderTargetFromShipment("unknown"), null);
  });

  it("auto-applies only through legal ORDER_TRANSITIONS", () => {
    // pending stays merchant-gated: courier says "picked" but pending cannot jump to shipped
    const picked = orderTargetFromShipment("picked");
    assert.ok(picked);
    assert.equal(ORDER_TRANSITIONS.pending.includes(picked), false);
    assert.equal(ORDER_TRANSITIONS.confirmed.includes(picked), true);
    // courier "delivered" on a confirmed order is ignored (merchant must ship first)
    const delivered = orderTargetFromShipment("delivered");
    assert.ok(delivered);
    assert.equal(ORDER_TRANSITIONS.confirmed.includes(delivered), false);
    assert.equal(ORDER_TRANSITIONS.shipped.includes(delivered), true);
    // courier "returned" on a shipped order is legal
    const returned = orderTargetFromShipment("returned");
    assert.ok(returned);
    assert.equal(ORDER_TRANSITIONS.shipped.includes(returned), true);
  });
});