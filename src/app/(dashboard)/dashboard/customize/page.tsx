import { redirect } from "next/navigation";
import { requireStore } from "@/lib/auth";
import { denyUnless } from "@/lib/team";
import { storeUrl } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/ui";
import { CustomizePanel } from "@/components/dashboard/CustomizePanel";

export default async function CustomizePage() {
  const { store, user } = await requireStore();
  if (await denyUnless(store, user, "manageAppearance")) redirect("/dashboard");
  return (
    <>
      <PageHeader title="Apparence" description="Template, identité visuelle et textes. Chaque publication met à jour la boutique instantanément." />
      <CustomizePanel key={store.updatedAt.toISOString()} store={store} previewUrl={storeUrl(store.subdomain)} />
    </>
  );
}
