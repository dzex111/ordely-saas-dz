import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { storeInvites, storeMembers, users } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { takenSeats } from "@/lib/team";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/ui";
import { TeamPanel } from "@/components/dashboard/TeamPanel";

export default async function TeamPage() {
  const { store, user } = await requireStore();
  const plan = getPlan(store.plan);
  // Owner-only + paid feature. Starter merchants never see this page (hidden from nav too).
  if (store.ownerId !== user.id || !plan.flags.teamManagement) redirect("/dashboard");

  const [memberRows, inviteRows] = await Promise.all([
    db
      .select({ id: storeMembers.id, role: storeMembers.role, email: users.email, name: users.name })
      .from(storeMembers)
      .innerJoin(users, eq(users.id, storeMembers.userId))
      .where(eq(storeMembers.storeId, store.id)),
    db.query.storeInvites.findMany({ where: eq(storeInvites.storeId, store.id), orderBy: [desc(storeInvites.createdAt)] }),
  ]);
  const used = await takenSeats(store.id);

  return (
    <>
      <PageHeader title="Équipe" description="Invitez des membres (admin ou simple membre) pour gérer la boutique avec vous." />
      <TeamPanel
        members={[
          { id: "owner", email: user.email, name: user.name, role: "owner", isOwner: true },
          ...memberRows.map((m) => ({ id: m.id, email: m.email, name: m.name, role: m.role, isOwner: false })),
        ]}
        invites={inviteRows
          .filter((i) => !i.acceptedAt)
          .map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role,
            expiresAt: formatDate(i.expiresAt),
            link: `/invite/${i.token}`,
          }))}
        seatsUsed={used + 1}
        seatsTotal={plan.limits.users}
      />
    </>
  );
}
