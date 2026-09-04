import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { storeInvites, stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AcceptInviteButton } from "@/components/ui/AcceptInviteButton";

export const metadata = { title: "Invitation équipe", robots: { index: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/invite/${token}`);
  const invite = await db.query.storeInvites.findFirst({ where: eq(storeInvites.token, token) });
  const store = invite ? await db.query.stores.findFirst({ where: eq(stores.id, invite.storeId) }) : null;
  const valid = !!invite && !!store && !invite.acceptedAt && invite.expiresAt > new Date();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <div className="db-card w-full max-w-md p-8 text-center">
        <Link href="/" aria-label="ORDELY - home"><img src="/logo.svg" alt="ORDELY" className="mx-auto h-8 w-auto" /></Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Invitation à rejoindre une équipe</h1>
        {!valid || !invite || !store ? (
          <p className="mt-3 text-sm text-zinc-500">Invitation introuvable ou expirée.</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-zinc-600">
              <span className="font-semibold text-zinc-900">{store.name}</span> vous invite en tant que{" "}
              <span className="font-semibold text-zinc-900">{invite.role === "admin" ? "admin" : "membre"}</span>.
            </p>
            <p className="mt-1 text-xs text-zinc-500">Connecté en tant que {user.email}</p>
            <div className="mt-6"><AcceptInviteButton token={token} /></div>
          </>
        )}
      </div>
    </div>
  );
}
