"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LayoutDashboard, ShoppingBag, Package, Users, Palette, Settings, CreditCard, ExternalLink, UsersRound, Check, ChevronDown, Plus, Store as StoreIcon, ChartColumn } from "lucide-react";
import { cn } from "@/lib/utils";
import { setActiveStoreAction } from "@/lib/actions/team";
import type { TeamAction } from "@/lib/team";

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; need?: TeamAction | "team" | "analytics" }[] = [
  { href: "/dashboard", label: "Vue d’ensemble", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/orders", label: "Commandes", icon: ShoppingBag },
  { href: "/dashboard/products", label: "Produits", icon: Package },
  { href: "/dashboard/customers", label: "Clients", icon: Users },
  { href: "/dashboard/analytics", label: "Analytique", icon: ChartColumn, need: "analytics" },
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
  showAnalytics,
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
  showAnalytics: boolean;
  showCreateStore: boolean;
  stores: SidebarStore[];
  currentStoreId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, startSwitch] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const picker = useRef<HTMLDivElement>(null);
  const visible = NAV.filter((n) => !n.need || (n.need === "team" ? showTeam : n.need === "analytics" ? showAnalytics : allowed.includes(n.need)));
  const current = stores.find((s) => s.id === currentStoreId);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (picker.current && !picker.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const switchTo = (id: string) => {
    setPickerOpen(false);
    if (id === currentStoreId) return;
    startSwitch(async () => {
      await setActiveStoreAction(id);
      router.refresh();
    });
  };

  return (
    <aside className="flex h-full w-full flex-col md:w-60">
      <div className="px-4 pb-2 pt-5">
        <Link href="/" aria-label="ORDELY - home"><img src="/logo.svg" alt="ORDELY" className="h-6 w-auto" /></Link>
        <div ref={picker} className="relative mt-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Boutique actuelle</p>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            disabled={switching}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left transition hover:bg-zinc-50"
            aria-haspopup="listbox"
            aria-expanded={pickerOpen}
          >
            <StoreIcon className="h-4 w-4 shrink-0 text-zinc-400" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{storeName}</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-zinc-400 transition", pickerOpen && "rotate-180")} />
          </button>
          {pickerOpen && (
            <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
              {stores.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={s.id === currentStoreId}
                  onClick={() => switchTo(s.id)}
                  className={cn("flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-zinc-50", s.id === currentStoreId && "bg-zinc-50")}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{s.name}</span>
                    <span className="block truncate text-xs text-zinc-500" dir="ltr">{s.subdomain}</span>
                  </span>
                  {s.id === currentStoreId && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                </button>
              ))}
              {showCreateStore && (
                <Link
                  href="/onboarding"
                  onClick={() => setPickerOpen(false)}
                  className="flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  <Plus className="h-4 w-4" /> Ajouter une boutique
                </Link>
              )}
            </div>
          )}
          {current && (
            <div className="mt-1 flex items-center justify-between">
              <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{plan}</span>
              <a href={storeHref} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900">
                Voir <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
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
