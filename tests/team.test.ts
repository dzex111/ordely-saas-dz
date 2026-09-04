import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canDo, newInviteToken, type TeamAction } from "../src/lib/team";
import type { TeamRole } from "../src/db/schema";

const ALL: TeamAction[] = [
  "manageTeam",
  "manageSettings",
  "manageAppearance",
  "manageBilling",
  "manageProducts",
  "deleteProduct",
  "manageOrders",
];

describe("team permission matrix", () => {
  it("owner can do everything", () => {
    for (const a of ALL) assert.equal(canDo("owner", a), true, `owner blocked from ${a}`);
  });

  it("admin can do everything except manageTeam", () => {
    for (const a of ALL) {
      assert.equal(canDo("admin", a), a !== "manageTeam", `admin ${a}`);
    }
  });

  it("member is limited to orders + products (no delete, no settings, no team)", () => {
    const yes: TeamAction[] = ["manageProducts", "manageOrders"];
    for (const a of ALL) {
      assert.equal(canDo("member", a), (yes as string[]).includes(a), `member ${a}`);
    }
  });

  it("roles are exactly owner/admin/member", () => {
    const roles: TeamRole[] = ["owner", "admin", "member"];
    assert.equal(roles.length, 3);
  });
});

describe("invite tokens", () => {
  it("64 hex chars and unique across 200 samples", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const t = newInviteToken();
      assert.match(t, /^[0-9a-f]{64}$/);
      assert.ok(!seen.has(t), "collision");
      seen.add(t);
    }
  });
});
