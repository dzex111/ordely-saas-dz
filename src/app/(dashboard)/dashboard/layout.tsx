import type { ReactNode } from "react";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { db } from "@/db";
import { notifications, orders, products, type NotificationType } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { getPlan } from "@/lib/plans";
import { storeUrl, timeAgo } from "@/lib/utils";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { NotificationsBell, type BellItem } from "@/components/dashboard/NotificationsBell";

export const dynamic = "force-dynamic";

const KIND: Record<NotificationType, BellItem["kind"]> = {
  new_order: "info",
  plan_changed: "info",
  unsuspended: "info",
  suspended: "alert",
  limit_warning: "warn",
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, store } = await requireStore();
  const plan = getPlan(store.plan);
  const [[{ value: pendingCount }], [{ value: productCount }], stored, [{ value: unread }]] = await Promise.all([
    db.select({ value: count() }).from(orders).where(and(eq(orders.storeId, store.id), eq(orders.status, "pending"))),
    db.select({ value: count() }).from(products).where(eq(products.storeId, store.id)),
    db.query.notifications.findMany({ where: eq(notifications.storeId, store.id), orderBy: [desc(notifications.createdAt)], limit: 12 }),
    db.select({ value: count() }).from(notifications).where(and(eq(notifications.storeId, store.id), isNull(notifications.readAt))),
  ]);

  const items: BellItem[] = [];
  if (store.suspended) {
    items.push({ id: "sys-suspended", title: "Boutique suspendue par l’admin", body: "Contactez l’admin via la page Contact.", link: "/contact", time: "maintenant", read: false, kind: "alert" });
  }
  if (store.planStatus === "trialing" && store.trialEndsAt && store.trialEndsAt.getTime() - Date.now() < 3 * 86400_000) {
    items.push({ id: "sys-trial", title: "Essai bientôt terminé", body: "Contactez l’admin pour activer votre plan.", link: "/dashboard/billing", time: "maintenant", read: false, kind: "warn" });
  }
  if (plan.productLimit !== null && productCount >= plan.productLimit) {
    items.push({ id: "sys-limit", title: `Limite ${plan.name} atteinte`, body: `${productCount} produits — passez au plan supérieur.`, link: "/dashboard/billing", time: "maintenant", read: false, kind: "warn" });
  }
  for (const n of stored) {
    items.push({ id: n.id, title: n.title, body: n.body, link: n.link, time: timeAgo(n.createdAt), read: n.readAt !== null, kind: KIND[n.type] ?? "info" });
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex max-w-[1400px] flex-col md:flex-row">
        <div className="border-b border-zinc-200 md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r">
          <Sidebar storeName={store.name} storeHref={storeUrl(store.subdomain)} pendingCount={pendingCount} plan={plan.name} />
        </div>
        <div className="min-w-0 flex-1">
          <header className="flex items-center gap-3 border-b border-zinc-200 bg-white/60 px-4 py-2.5 backdrop-blur md:px-6">
            <DashboardSearch />
            <div className="ml-auto flex items-center gap-1">
              <NotificationsBell items={items} unread={unread + items.filter((i) => i.id.startsWith("sys-") && !i.read).length} />
              <p className="hidden text-xs text-zinc-500 lg:block">
                {user.name || user.email} · <span className="font-medium text-zinc-700">{store.subdomain}</span>
              </p>
              <form action={logoutAction}>
                <button className="flex items-center gap-1.5 rounded-full p-2 text-xs text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900" title="Déconnexion"><LogOut className="h-4 w-4" /></button>
              </form>
            </div>
          </header>
          <main className="px-6 py-8 md:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
