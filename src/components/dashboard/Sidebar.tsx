"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { LayoutDashboard, ShoppingBag, Package, Users, Palette, Settings, CreditCard, ExternalLink, UsersRound, ArrowLeftRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { setActiveStoreAction } from "@/lib/actions/team";
import type { TeamAction } from "@/lib/team";

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; need?: TeamAction | "team" }[] = [
  { href: "/dashboard", label: "Vue d’ensemble", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/orders", label: "Commandes", icon: ShoppingBag },
  { href: "/dashboard/products", label: "Produits", icon: Package },
  { href: "/dashboard/customers", label: "Clients", icon: Users },
  { href: "/dashboard/customize", label: "Apparence", icon: Palette, need: "manageAppearance" },
  { href: "/dashboard/team", label: "Équipe", icon: UsersRound, need: "team" },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings, need: "manageSettings" },
  { href: "/dashboard/billing", label: "Abonnement", icon: CreditCard, need: "manageBilling" },
];

export type SidebarStore = { id: string; name: string; subdomain: string };

export function Sidebar({
  storeName,
  storeHref,
  pendingCount,
  plan,
  allowed,
  showTeam,
  showCreateStore,
  stores,
  currentStoreId,
}: {
  storeName: string;
  storeHref: string;
  pendingCount: number;
  plan: string;
  allowed: TeamAction[];
  showTeam: boolean;
  showCreateStore: boolean;
  stores: SidebarStore[];
  currentStoreId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, startSwitch] = useTransition();
  const visible = NAV.filter((n) => !n.need || (n.need === "team" ? showTeam : allowed.includes(n.need)));

  return (
    <aside className="flex h-full w-full flex-col md:w-60">
      <div className="px-4 pb-2 pt-5">
        <Link href="/" aria-label="ORDELY - home"><img src="/logo.svg" alt="ORDELY" className="h-6 w-auto" /></Link>
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          {stores.length > 1 ? (
            <label className="flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <select
                value={currentStoreId}
                disabled={switching}
                onChange={(e) => startSwitch(async () => {
                  await setActiveStoreAction(e.target.value);
                  router.refresh();
                })}
                className="w-full truncate bg-transparent text-sm font-semibold outline-none"
                aria-label="Changer de boutique"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          ) : (
            <p className="truncate text-sm font-semibold">{storeName}</p>
          )}
          <div className="mt-1 flex items-center justify-between">
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{plan}</span>
            <span className="flex items-center gap-1">
              {showCreateStore && (
                <Link href="/onboarding" title="Créer une boutique" aria-label="Créer une boutique" className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900">
                  <Plus className="h-3.5 w-3.5" />
                </Link>
              )}
              <a href={storeHref} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900">
                Voir <ExternalLink className="h-3 w-3" />
              </a>
            </span>
          </div>
        </div>
      </div>
      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto px-3 py-2 md:flex-col md:overflow-visible">
        {visible.map((n) => {
          const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className={cn("flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition", active ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")}>
              <n.icon className="h-4 w-4" strokeWidth={1.9} />
              <span>{n.label}</span>
              {n.href === "/dashboard/orders" && pendingCount > 0 && (
                <span className={cn("ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums", active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800")}>{pendingCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
