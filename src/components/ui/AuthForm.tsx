"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loginAction, signupAction } from "@/lib/actions/auth";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? loginAction : signupAction, null);
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "signup" && (
        <div>
          <label className="db-label" htmlFor="name">Votre nom</label>
          <input id="name" name="name" required minLength={2} autoComplete="name" className="db-input" placeholder="Amina Benali" />
        </div>
      )}
      <div>
        <label className="db-label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="db-input" placeholder="vous@marque.dz" />
      </div>
      <div>
        <label className="db-label" htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} className="db-input" placeholder="8 caractères minimum" />
      </div>
      {state?.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      {state?.info && <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">{state.info}</p>}
      <button type="submit" disabled={pending} className="db-btn w-full !py-2.5">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "login" ? "Se connecter" : "Créer mon compte"}
      </button>
      <p className="text-center text-xs text-zinc-500">
        {mode === "login" ? (
          <>Pas encore de compte ? <Link href="/signup" className="font-medium text-zinc-900 underline-offset-4 hover:underline">Créer une boutique</Link></>
        ) : (
          <>Déjà inscrit ? <Link href="/login" className="font-medium text-zinc-900 underline-offset-4 hover:underline">Se connecter</Link></>
        )}
      </p>
    </form>
  );
}
