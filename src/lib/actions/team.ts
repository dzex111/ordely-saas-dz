"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { storeInvites, storeMembers, stores, users, type MemberRole } from "@/db/schema";
import { ACTIVE_STORE_COOKIE, requireStore, requireUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { denyUnless, newInviteToken, takenSeats } from "@/lib/team";
import type { FormState } from "./auth";

const INVITE_DAYS = 7;

function seatsError(planUsers: number): string {
  return `Limite d’utilisateurs atteinte (${planUsers} sur ce plan). ${planUsers < 10 ? "Passez au plan supérieur pour inviter plus." : ""}`.trim();
}

/** Owner-only: invite a teammate by email (link to share, no mail infra needed). */
export async function inviteMemberAction(_: FormState, formData: FormData): Promise<FormState> {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageTeam");
  if (denied) return { error: denied };
  const plan = getPlan(store.plan);
  if (!plan.flags.teamManagement) return { error: "La gestion d’équipe nécessite le plan PRO." };

  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().email("Email invalide."),
      role: z.enum(["admin", "member"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, role } = parsed.data as { email: string; role: MemberRole };
  if (email === user.email) return { error: "Vous êtes déjà propriétaire de cette boutique." };

  const target = await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true } });
  if (target) {
    if (store.ownerId === target.id) return { error: "Cet utilisateur est déjà propriétaire." };
    const already = await db.query.storeMembers.findFirst({
      where: and(eq(storeMembers.storeId, store.id), eq(storeMembers.userId, target.id)),
      columns: { id: true },
    });
    if (already) return { error: "Cet utilisateur est déjà membre de l’équipe." };
  }
  const dup = await db.query.storeInvites.findFirst({
    where: and(eq(storeInvites.storeId, store.id), eq(storeInvites.email, email)),
  });
  if (dup && !dup.acceptedAt && dup.expiresAt > new Date()) {
    return { error: "Une invitation est déjà en attente pour cet email." };
  }

  // Seats: owner occupies 1 of plan.limits.users.
  if ((await takenSeats(store.id)) >= plan.limits.users - 1) return { error: seatsError(plan.limits.users) };

  await db.insert(storeInvites).values({
    storeId: store.id,
    email,
    role,
    token: newInviteToken(),
    expiresAt: new Date(Date.now() + INVITE_DAYS * 86400_000),
  });
  revalidatePath("/dashboard/team");
  return { success: `Invitation créée pour ${email}. Partagez-lui le lien.` };
}

/** Owner-only: revoke a pending invite. */
export async function revokeInviteAction(inviteId: string) {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageTeam");
  if (denied) return { error: denied };
  await db.delete(storeInvites).where(and(eq(storeInvites.id, inviteId), eq(storeInvites.storeId, store.id)));
  revalidatePath("/dashboard/team");
  return { success: "Invitation révoquée." };
}

/** Owner-only: remove a member (owner row never exists, so owner is safe). */
export async function removeMemberAction(memberId: string) {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageTeam");
  if (denied) return { error: denied };
  await db.delete(storeMembers).where(and(eq(storeMembers.id, memberId), eq(storeMembers.storeId, store.id)));
  revalidatePath("/dashboard/team");
  return { success: "Membre retiré." };
}

/** Owner-only: change a member's role. */
export async function changeMemberRoleAction(memberId: string, role: string) {
  const { store, user } = await requireStore();
  const denied = await denyUnless(store, user, "manageTeam");
  if (denied) return { error: denied };
  if (role !== "admin" && role !== "member") return { error: "Rôle inconnu." };
  await db.update(storeMembers).set({ role }).where(and(eq(storeMembers.id, memberId), eq(storeMembers.storeId, store.id)));
  revalidatePath("/dashboard/team");
  return { success: "Rôle mis à jour." };
}

/** Accept an invite link. The logged-in email must match the invite. */
export async function acceptInviteAction(token: string): Promise<FormState> {
  const user = await requireUser();
  const invite = await db.query.storeInvites.findFirst({ where: eq(storeInvites.token, token) });
  if (!invite) return { error: "Invitation introuvable." };
  if (invite.acceptedAt) return { error: "Invitation déjà utilisée." };
  if (invite.expiresAt < new Date()) return { error: "Invitation expirée." };
  if (invite.email !== user.email) return { error: `Connectez-vous avec ${invite.email} pour accepter.` };
  const store = await db.query.stores.findFirst({ where: eq(stores.id, invite.storeId) });
  if (!store) return { error: "Boutique introuvable." };
  if (store.ownerId === user.id) return { error: "Vous êtes déjà propriétaire." };
  const plan = getPlan(store.plan);
  const existing = await db.query.storeMembers.findFirst({
    where: and(eq(storeMembers.storeId, store.id), eq(storeMembers.userId, user.id)),
    columns: { id: true },
  });
  if (!existing && (await takenSeats(store.id)) >= plan.limits.users - 1) {
    return { error: seatsError(plan.limits.users) };
  }
  if (!existing) {
    await db.insert(storeMembers).values({ storeId: store.id, userId: user.id, role: invite.role });
  }
  await db.update(storeInvites).set({ acceptedAt: new Date() }).where(eq(storeInvites.id, invite.id));
  const jar = await cookies();
  jar.set(ACTIVE_STORE_COOKIE, store.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 365 * 86400 });
  redirect("/dashboard");
}

/** Switch the active store (must be owned or member). */
export async function setActiveStoreAction(storeId: string) {
  const user = await requireUser();
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) return { error: "Boutique introuvable." };
  const denied = await denyUnless(store, user, "manageOrders").catch(() => "Accès refusé.");
  if (denied) return { error: denied };
  const jar = await cookies();
  jar.set(ACTIVE_STORE_COOKIE, store.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 365 * 86400 });
  redirect("/dashboard");
}
