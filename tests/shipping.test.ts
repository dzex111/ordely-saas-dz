import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeStatus, type ShippingProvider } from "../src/lib/shipping/types";
import { yalidineProvider, buildYalidinePayload } from "../src/lib/shipping/yalidine";
import { zrProvider, buildZrPayload } from "../src/lib/shipping/zr";
import { ecotrackProvider, resolveEcoTrackBase, ECOTRACK_COMPANIES } from "../src/lib/shipping/ecotrack";
import { getProvider, PROVIDERS, providerLabel } from "../src/lib/shipping/index";

const input = {
  reference: "ORD-0042",
  fullName: "Amina Benali",
  phone: "0550123456",
  address: "Cite 120, Bt 3",
  commune: "Hydra",
  wilayaCode: "16",
  wilayaName: "Alger",
  deliveryType: "home" as const,
  productList: "Robe x1",
  codAmount: 8900,
};

describe("provider interface conformance (all 5 methods)", () => {
  const methods = ["testConnection", "createShipment", "trackShipment", "cancelShipment", "getRates", "getLocations"] as const;
  for (const p of PROVIDERS) {
    it(`${p.id} implements everything`, () => {
      for (const m of methods) assert.equal(typeof p[m], "function", `${p.id}.${m}`);
    });
  }
  it("registry resolves yalidine/zr/ecotrack, rejects unknown", () => {
    assert.ok(getProvider("yalidine") && getProvider("zr") && getProvider("ecotrack"));
    assert.equal(getProvider("noest"), null);
    assert.equal(providerLabel("yalidine"), "Yalidine");
  });
});

describe("Yalidine payload mapping", () => {
  it("maps order fields to documented parcel fields", () => {
    const p = buildYalidinePayload(input);
    assert.equal(p.order_id, "ORD-0042");
    assert.equal(p.firstname, "Amina");
    assert.equal(p.familyname, "Benali");
    assert.equal(p.contact_phone, "0550123456");
    assert.equal(p.to_commune_name, "Hydra");
    assert.equal(p.to_wilaya_name, "Alger");
    assert.equal(p.price, 8900);
    assert.equal(p.is_stopdesk, false);
  });
  it("single-word names and desk delivery map correctly", () => {
    const p = buildYalidinePayload({ ...input, fullName: "Yacine", deliveryType: "desk" });
    assert.equal(p.firstname, "Yacine");
    assert.equal(p.is_stopdesk, true);
  });
});

describe("ZR payload mapping", () => {
  it("uses Procolis order fields and confirms by default", () => {
    const p = buildZrPayload(input);
    assert.equal(p.Tracking, "ORD-0042");
    assert.equal(p.Client, "Amina Benali");
    assert.equal(p.IDWilaya, "16");
    assert.equal(p.Total, "8900");
    assert.equal(p.Confrimee, 1);
  });
  it("cancel is honestly unsupported (dashboard-only)", async () => {
    await assert.rejects(() => zrProvider.cancelShipment({}, "x"), /dashboard/i);
  });
});

describe("EcoTrack company routing", () => {
  it("known presets resolve, custom URL wins", () => {
    assert.equal(resolveEcoTrackBase({ company: "dhd" }), "https://platform.dhd-dz.com");
    assert.equal(resolveEcoTrackBase({ company: "conexlog" }), "https://app.conexlog-dz.com");
    assert.equal(resolveEcoTrackBase({ company: "dhd", baseUrl: "https://x.example.com" }), "https://x.example.com");
    assert.equal(resolveEcoTrackBase({ company: "nope" }), null);
  });
  it("covers the requested companies", () => {
    for (const id of ["dhd", "conexlog", "msm-go", "rocket", "world-express", "anderson"]) {
      assert.ok(ECOTRACK_COMPANIES.some((c) => c.id === id), id);
    }
  });
  it("cancel is honestly unsupported", async () => {
    await assert.rejects(() => ecotrackProvider.cancelShipment({}, "x"), /dashboard/i);
  });
});

describe("status normalization (unified vocabulary)", () => {
  const cases: [string, string][] = [
    ["Livré", "delivered"],
    ["Retour", "returned"],
    ["Annulé", "cancelled"],
    ["Ramassé", "picked"],
    ["En transit", "transit"],
    ["Sorti en livraison", "transit"],
    ["xyz-unknown-123", "unknown"],
  ];
  for (const [raw, expected] of cases) {
    it(`"${raw}" -> ${expected}`, () => {
      assert.equal(normalizeStatus(raw), expected);
    });
  }
});

describe("provider honesty markers", () => {
  it("ZR has no labels, EcoTrack cancel unsupported", () => {
    assert.equal(zrProvider.supports.labels, false);
    assert.equal(zrProvider.supports.cancel, false);
    const p: ShippingProvider = ecotrackProvider;
    assert.equal(typeof p.testConnection, "function");
  });
});
