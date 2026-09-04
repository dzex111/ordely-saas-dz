import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccessibleStores, getOwnedStore, requireUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/dashboard/OnboardingForm";

export const metadata = { title: "Créer votre boutique" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (await getOwnedStore()) redirect("/dashboard");
  // Invited members with no owned store may skip creation and go straight to teamwork.
  const hasTeamAccess = (await getAccessibleStores()).length > 0;
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-zinc-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <img src="/logo.svg" alt="ORDELY" className="h-6 w-auto" />
          <span className="text-xs text-zinc-500">{user.email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs font-medium uppercase tracking-widest text-brand">Étape unique</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Votre boutique, prête en 2 minutes.</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-500">Nom, adresse, univers visuel. Tout le reste se règle depuis le tableau de bord — et se reflète instantanément sur votre boutique.</p>
        {hasTeamAccess && (
          <p className="mt-3 max-w-xl text-sm text-zinc-600">
            Invité dans une équipe ?{" "}
            <Link href="/dashboard" className="font-medium text-zinc-900 underline underline-offset-4 hover:no-underline">
              Passer cette étape →
            </Link>
          </p>
        )}
        <div className="mt-10">
          <OnboardingForm />
        </div>
      </main>
    </div>
  );
}
