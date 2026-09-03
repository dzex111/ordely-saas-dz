import Link from "next/link";
import type { ReactNode } from "react";
import type { OrderStatus } from "@/db/schema";
import { STATUS_META } from "@/lib/commerce";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", m.tone)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} /> {m.label}
    </span>
  );
}

export function EmptyState({ title, description, cta }: { title: string; description: string; cta?: { href: string; label: string } }) {
  return (
    <div className="db-card flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200" />
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>
      {cta && <Link href={cta.href} className="db-btn mt-6">{cta.label}</Link>}
    </div>
  );
}

export function Notice({ state }: { state: { error?: string; success?: string; info?: string } | null }) {
  if (!state) return null;
  if (state.error) return <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>;
  if (state.success) return <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>;
  if (state.info) return <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">{state.info}</p>;
  return null;
}
