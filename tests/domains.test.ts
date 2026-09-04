import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeCustomDomain, validateCustomDomain } from "../src/lib/custom-domains";

const ROOT = "ordely-saas-dz.vercel.app";

describe("custom domain normalization", () => {
  it("lowercases, strips protocol/path/port/trailing dots", () => {
    assert.equal(normalizeCustomDomain("https://Boutique-Monsite.DZ/shop?q=1"), "boutique-monsite.dz");
    assert.equal(normalizeCustomDomain("  WWW.Shop-DZ.com.  "), "www.shop-dz.com");
    assert.equal(normalizeCustomDomain("shop.dz:443"), "shop.dz");
  });
});

describe("custom domain validation", () => {
  it("accepts normal apex and sub hostnames", () => {
    assert.equal(validateCustomDomain("boutique-monsite.dz", ROOT), null);
    assert.equal(validateCustomDomain("www.shop-dz.com", ROOT), null);
    assert.equal(validateCustomDomain("shop.monsite.dz", ROOT), null);
  });

  it("rejects garbage, IPs, localhost", () => {
    assert.ok(validateCustomDomain("", ROOT));
    assert.ok(validateCustomDomain("not a domain", ROOT));
    assert.ok(validateCustomDomain("-bad.dz", ROOT));
    assert.ok(validateCustomDomain("1.2.3.4", ROOT));
    assert.ok(validateCustomDomain("localhost", ROOT));
  });

  it("rejects vercel.app and our own platform domain", () => {
    assert.ok(validateCustomDomain("evil.vercel.app", ROOT));
    assert.ok(validateCustomDomain(ROOT, ROOT));
    assert.ok(validateCustomDomain(`shop.${ROOT}`, ROOT));
  });
});
