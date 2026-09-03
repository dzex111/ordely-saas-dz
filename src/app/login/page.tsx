import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/ui/AuthForm";
import { AuthShell } from "@/components/ui/AuthShell";

export const metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { next } = await searchParams;
  return (
    <AuthShell title="Bon retour" subtitle="Connectez-vous à votre espace marchand.">
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
