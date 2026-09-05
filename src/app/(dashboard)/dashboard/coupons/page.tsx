import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { denyUnless } from "@/lib/team";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/ui";
import { CouponsPanel } from "@/components/dashboard/CouponsPanel";

export default async function CouponsPage() {
  const { store, user } = await requireStore();
  if (await denyUnless(store, user, "manageProducts")) redirect("/dashboard");

  const rows = await db.query.coupons.findMany({ where: eq(coupons.storeId, store.id), orderBy: [desc(coupons.createdAt)] });
  return (
    <>
      <PageHeader title="Codes promo" description="Réductions en % ou montant fixe, avec fenêtre de validité et limite d'usages." />
      <CouponsPanel
        rows={rows.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          value: c.value,
          minSubtotal: c.minSubtotal,
          maxUses: c.maxUses,
          usedCount: c.usedCount,
          startsAt: c.startsAt ? c.startsAt.toISOString() : null,
          endsAt: c.endsAt ? c.endsAt.toISOString() : null,
          isActive: c.isActive,
        }))}
      />
    </>
  );
}
