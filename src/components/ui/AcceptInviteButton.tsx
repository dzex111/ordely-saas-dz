"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { acceptInviteAction } from "@/lib/actions/team";

export function AcceptInviteButton({ token }: { token: string }) {
  const [state, action, pending] = useActionState(async () => acceptInviteAction(token), null);
  return (
    <form action={action}>
      {state?.error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      <button disabled={pending} className="db-btn w-full !py-2.5">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Rejoindre l’équipe
      </button>
    </form>
  );
}
