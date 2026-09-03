import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/ui/AuthForm";
import { AuthShell } from "@/components/ui/AuthShell";

export const metadata = { title: "Créer un compte" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <AuthShell title="Créez votre boutique" subtitle="Gratuit pour commencer. Aucune carte bancaire.">
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
