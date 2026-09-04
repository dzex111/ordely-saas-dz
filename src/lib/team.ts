import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { storeInvites, storeMembers, type Store, type TeamRole, type User } from "@/db/schema";

/* Team roles & permissions (central matrix).
 * owner  — implicit via stores.ownerId, full access.
 * admin  — everything except team management.
 * member — orders + products + customers only. */

export type TeamAction =
  | "manageTeam"
  | "manageSettings"
  | "manageAppearance"
  | "manageBilling"
  | "manageProducts"
  | "deleteProduct"
  | "manageOrders";

const MATRIX: Record<TeamRole, Record<TeamAction, boolean>> = {
  owner: {
    manageTeam: true,
    manageSettings: true,
    manageAppearance: true,
    manageBilling: true,
    manageProducts: true,
    deleteProduct: true,
    manageOrders: true,
  },
  admin: {
    manageTeam: false,
    manageSettings: true,
    manageAppearance: true,
    manageBilling: true,
    manageProducts: true,
    deleteProduct: true,
    manageOrders: true,
  },
  member: {
    manageTeam: false,
    manageSettings: false,
    manageAppearance: false,
    manageBilling: false,
    manageProducts: true,
    deleteProduct: false,
    manageOrders: true,
  },
};

export function canDo(role: TeamRole, action: TeamAction): boolean {
  return MATRIX[role][action];
}

/** Role of a user on a store (null = no access). Owner never has a member row. */
export async function roleOf(store: Pick<Store, "id" | "ownerId">, userId: string): Promise<TeamRole | null> {
  if (store.ownerId === userId) return "owner";
  const row = await db.query.storeMembers.findFirst({
    where: and(eq(storeMembers.storeId, store.id), eq(storeMembers.userId, userId)),
    columns: { role: true },
  });
  return row?.role ?? null;
}

/** French denial message, or null when allowed. Use at the top of every gated server action. */
export async function denyUnless(
  store: Pick<Store, "id" | "ownerId">,
  user: Pick<User, "id">,
  action: TeamAction,
): Promise<string | null> {
  const role = await roleOf(store, user.id);
  if (!role) return "Accès refusé.";
  if (!canDo(role, action)) return "Votre rôle ne permet pas cette action.";
  return null;
}

export function newInviteToken(): string {
  return randomBytes(32).toString("hex");
}

/** Seats taken by accepted members + pending invites (owner is implicit, not counted). */
export async function takenSeats(storeId: string): Promise<number> {
  const [members, invites] = await Promise.all([
    db.query.storeMembers.findMany({ where: eq(storeMembers.storeId, storeId), columns: { id: true } }),
    db.query.storeInvites.findMany({
      where: and(eq(storeInvites.storeId, storeId), isNull(storeInvites.acceptedAt)),
      columns: { id: true },
    }),
  ]);
  return members.length + invites.length;
}
