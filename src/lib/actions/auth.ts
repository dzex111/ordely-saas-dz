"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut, signUp } from "@/lib/auth";
import { verifyTurnstile } from "@/lib/turnstile";

export type FormState = { error?: string; info?: string; success?: string } | null;

const credentials = z.object({
  email: z.string().email("Email invalide."),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum."),
});

function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
}

export async function signupAction(_: FormState, formData: FormData): Promise<FormState> {
  // Honeypot: fake the normal "check your mailbox" flow, create nothing.
  if (typeof formData.get("company") === "string" && (formData.get("company") as string).trim() !== "") {
    return { info: "Vérifiez votre boîte mail pour confirmer votre compte, puis connectez-vous." };
  }
  if (!(await verifyTurnstile(formData.get("cf-turnstile-response") as string | null))) {
    return { error: "Vérification anti-robot échouée. Réessayez." };
  }
  const parsed = credentials.extend({ name: z.string().min(2, "Votre nom est requis.") }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const res = await signUp(parsed.data.email, parsed.data.password, parsed.data.name);
  if (!res.ok) return res.info ? { info: res.error } : { error: res.error };
  redirect("/onboarding");
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  if (typeof formData.get("company") === "string" && (formData.get("company") as string).trim() !== "") {
    return { error: "Email ou mot de passe incorrect." };
  }
  if (!(await verifyTurnstile(formData.get("cf-turnstile-response") as string | null))) {
    return { error: "Vérification anti-robot échouée. Réessayez." };
  }
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const res = await signIn(parsed.data.email, parsed.data.password);
  if (!res.ok) return { error: res.error };
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}
