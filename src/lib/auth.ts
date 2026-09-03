import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { sessions, stores, users, type Store, type User } from "@/db/schema";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

const SESSION_COOKIE = "ordely_session";
const SESSION_DAYS = 30;

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
  return (await db.query.stores.findFirst({ where: eq(stores.ownerId, user.id) })) ?? null;
});

/** Dashboard guard: needs a user AND a store; otherwise routes to the right step. */
export async function requireStore(): Promise<{ user: User; store: Store }> {
  const user = await requireUser();
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");
  return { user, store };
}
