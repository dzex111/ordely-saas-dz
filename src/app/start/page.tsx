import Link from "next/link";
import { redirect } from "next/navigation";
import { Store, UsersRound } from "lucide-react";
import { getAccessibleStores, getOwnedStore, requireUser } from "@/lib/auth";
import { JoinTeamForm } from "@/components/ui/JoinTeamForm";

export const metadata = { title: "Commencer", robots: { index: false } };

/** Hub for storeless users (skipped onboarding): create a store or join a team. */
export default async function StartPage() {
  const user = await requireUser();
  if (await getOwnedStore()) redirect("/dashboard");
  const access = await getAccessibleStores();
  if (access.length > 0) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <div className="w-full max-w-2xl">
        <Link href="/" aria-label="ORDELY - home"><img src="/logo.svg" alt="ORDELY" className="mx-auto h-8 w-auto" /></Link>
        <h1 className="mt-6 text-center text-3xl font-semibold tracking-tight">Bienvenue, {user.name || user.email} !</h1>
        <p className="mt-2 text-center text-sm text-zinc-500">Créez votre boutique, ou rejoignez une équipe qui vous a invité.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="db-card p-6">
            <Store className="h-6 w-6 text-zinc-900" />
            <p className="mt-3 font-semibold">Créer ma boutique</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">Nom, template, produits — en 2 minutes, gratuitement.</p>
            <Link href="/onboarding" className="db-btn mt-5 w-full">Créer ma boutique</Link>
          </div>
          <div className="db-card p-6">
            <UsersRound className="h-6 w-6 text-zinc-900" />
            <p className="mt-3 font-semibold">Rejoindre une équipe</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">Vous avez reçu un lien d’invitation ? Collez-le ici.</p>
            <JoinTeamForm />
          </div>
        </div>
      </div>
    </div>
  );
}
