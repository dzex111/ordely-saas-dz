import type { ReactNode } from "react";
import { and, count, eq } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { getPlan } from "@/lib/plans";
import { storeUrl } from "@/lib/utils";
import { Sidebar } from "@/components/dashboard/Sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, store } = await requireStore();
  const [{ value: pendingCount }] = await db.select({ value: count() }).from(orders).where(and(eq(orders.storeId, store.id), eq(orders.status, "pending")));
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex max-w-[1400px] flex-col md:flex-row">
        <div className="border-b border-zinc-200 md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r">
          <Sidebar storeName={store.name} storeHref={storeUrl(store.subdomain)} pendingCount={pendingCount} plan={getPlan(store.plan).name} />
        </div>
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-zinc-200 bg-white/60 px-6 py-3 backdrop-blur">
            <p className="text-xs text-zinc-500">
              {user.name || user.email} · <span className="font-medium text-zinc-700">{store.subdomain}</span>
            </p>
            <form action={logoutAction}>
              <button className="flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-900"><LogOut className="h-3.5 w-3.5" /> Déconnexion</button>
            </form>
          </header>
          <main className="px-6 py-8 md:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
