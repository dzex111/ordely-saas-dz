import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, eq, gt } from "drizzle-orm";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { sessions, storeMembers, stores, users, type Store, type TeamRole, type User } from "@/db/schema";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

const SESSION_COOKIE = "ordely_session";
export const ACTIVE_STORE_COOKIE = "ordely_store";
const SESSION_DAYS = 30;

async function isStoreMember(storeId: string, userId: string): Promise<boolean> {
  const row = await db.query.storeMembers.findFirst({
    where: and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, userId)),
    columns: { id: true },
  });
  return !!row;
}

async function memberRole(storeId: string, userId: string) {
  const row = await db.query.storeMembers.findFirst({
    where: and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, userId)),
    columns: { role: true },
  });
  return row?.role ?? null;
}

async function firstMemberStore(userId: string): Promise<Store | null> {
  const membership = await db.query.storeMembers.findFirst({ where: eq(storeMembers.userId, userId) });
  if (!membership) return null;
  return (await db.query.stores.findFirst({ where: eq(stores.id, membership.storeId) })) ?? null;
}

/* ------------------------------ password utils ----------------------------- */

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/* ------------------------------ local sessions ----------------------------- */

async function createLocalSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/* --------------------------------- public API ------------------------------ */

export type AuthResult = { ok: true } | { ok: false; error: string; info?: boolean };

export async function signUp(email: string, password: string, name: string): Promise<AuthResult> {
  email = email.trim().toLowerCase();
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: "Inscription impossible pour le moment." };
    await db
      .insert(users)
      .values({ id: data.user.id, email, name, authProvider: "supabase" })
      .onConflictDoNothing();
    if (!data.session) {
      return {
        ok: false,
        info: true,
        error: "Vérifiez votre boîte mail pour confirmer votre compte, puis connectez-vous.",
      };
    }
    return { ok: true };
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return { ok: false, error: "Un compte existe déjà avec cet email." };
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash: hashPassword(password), authProvider: "local" })
    .returning();
  await createLocalSession(user.id);
  return { ok: true };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  email = email.trim().toLowerCase();
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { ok: false, error: "Email ou mot de passe incorrect." };
    await db
      .insert(users)
      .values({
        id: data.user.id,
        email,
        name: (data.user.user_metadata?.name as string | undefined) ?? "",
        authProvider: "supabase",
      })
      .onConflictDoNothing();
    return { ok: true };
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: "Email ou mot de passe incorrect." };
  }
  await createLocalSession(user.id);
  return { ok: true };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  }
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
    jar.delete(SESSION_COOKIE);
  }
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const row = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    if (row) return row;
    const [created] = await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email ?? `${user.id}@placeholder.local`,
        name: (user.user_metadata?.name as string | undefined) ?? "",
        authProvider: "supabase",
      })
      .onConflictDoNothing()
      .returning();
    return created ?? (await db.query.users.findFirst({ where: eq(users.id, user.id) })) ?? null;
  }

  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export const getCurrentStore = cache(async (): Promise<Store | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  // Active store chosen by the merchant (team switching), validated as owned or member.
  try {
    const jar = await cookies();
    const activeId = jar.get(ACTIVE_STORE_COOKIE)?.value;
    if (activeId) {
      const s = await db.query.stores.findFirst({ where: eq(stores.id, activeId) });
      if (s && (s.ownerId === user.id || (await isStoreMember(s.id, user.id)))) return s;
    }
  } catch {
    // cookies() unavailable (e.g. static context) — fall through to defaults.
  }
  return (
    (await db.query.stores.findFirst({ where: eq(stores.ownerId, user.id), orderBy: [asc(stores.createdAt)] })) ??
    (await firstMemberStore(user.id))
  );
});

/** First store OWNED by the user (ignores memberships) — for onboarding/create flows. */
export async function getOwnedStore(): Promise<Store | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return (await db.query.stores.findFirst({ where: eq(stores.ownerId, user.id), orderBy: [asc(stores.createdAt)] })) ?? null;
}

/** All stores the user can access (owned first, then member), for the switcher. */
export async function getAccessibleStores(): Promise<{ store: Store; isOwner: boolean }[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const [owned, memberships] = await Promise.all([
    db.query.stores.findMany({ where: eq(stores.ownerId, user.id), orderBy: [asc(stores.createdAt)] }),
    db.query.storeMembers.findMany({ where: eq(storeMembers.userId, user.id) }),
  ]);
  const ownedIds = new Set(owned.map((s) => s.id));
  const memberStores = (
    await Promise.all(
      memberships.map((m) => db.query.stores.findFirst({ where: eq(stores.id, m.storeId) })),
    )
  ).filter((s): s is Store => !!s && !ownedIds.has(s.id));
  return [...owned.map((store) => ({ store, isOwner: true })), ...memberStores.map((store) => ({ store, isOwner: false }))];
}

/** Dashboard guard: needs a user AND a store; otherwise routes to the right step. */
export async function requireStore(): Promise<{ user: User; store: Store; role: TeamRole }> {
  const user = await requireUser();
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");
  const role = store.ownerId === user.id ? ("owner" as const) : ((await memberRole(store.id, user.id)) ?? null);
  if (!role) redirect("/onboarding");
  return { user, store, role };
}
