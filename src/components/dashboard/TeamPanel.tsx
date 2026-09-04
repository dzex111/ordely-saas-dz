"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Trash2 } from "lucide-react";
import { changeMemberRoleAction, inviteMemberAction, removeMemberAction, revokeInviteAction } from "@/lib/actions/team";

export type TeamMemberRow = { id: string; email: string; name: string; role: string; isOwner: boolean };
export type TeamInviteRow = { id: string; email: string; role: string; expiresAt: string; link: string };

export function TeamPanel({ members, invites, seatsUsed, seatsTotal }: { members: TeamMemberRow[]; invites: TeamInviteRow[]; seatsUsed: number; seatsTotal: number }) {
  const [state, action, pending] = useActionState(inviteMemberAction, null);
  const [busy, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) => start(async () => {
    await fn();
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <div className="db-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Membres ({seatsUsed} / {seatsTotal} places)</p>
        </div>
        <ul className="mt-3 divide-y divide-zinc-100">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.name || m.email}</p>
                <p className="truncate text-xs text-zinc-500">{m.email}</p>
              </div>
              {m.isOwner ? (
                <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">Propriétaire</span>
              ) : (
                <>
                  <select
                    defaultValue={m.role}
                    disabled={busy}
                    onChange={(e) => run(() => changeMemberRoleAction(m.id, e.target.value))}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs"
                    aria-label="Rôle"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Membre</option>
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (confirm("Retirer ce membre de l’équipe ?")) run(() => removeMemberAction(m.id));
                    }}
                    aria-label="Retirer"
                    className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="db-card p-5">
        <p className="text-sm font-semibold">Inviter un membre</p>
        <form action={action} className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px_auto]">
          <input name="email" type="email" required placeholder="membre@exemple.dz" className="db-input" />
          <select name="role" defaultValue="member" className="db-input" aria-label="Rôle">
            <option value="admin">Admin</option>
            <option value="member">Membre</option>
          </select>
          <button disabled={pending} className="db-btn">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Inviter
          </button>
        </form>
        {state?.error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
        {state?.success && <p role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>}
        {invites.length > 0 && (
          <ul className="mt-4 divide-y divide-zinc-100">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{inv.email}</p>
                  <p className="text-xs text-zinc-500">{inv.role === "admin" ? "Admin" : "Membre"} · expire le {inv.expiresAt}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await navigator.clipboard.writeText(new URL(inv.link, window.location.origin).toString());
                    alert("Lien copié !");
                  }}
                  className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium transition hover:bg-zinc-50"
                >
                  <Copy className="h-3.5 w-3.5" /> Copier le lien
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => revokeInviteAction(inv.id))}
                  className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Révoquer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
