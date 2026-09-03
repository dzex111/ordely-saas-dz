"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, Users, Palette, Settings, CreditCard, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Vue d’ensemble", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/orders", label: "Commandes", icon: ShoppingBag },
  { href: "/dashboard/products", label: "Produits", icon: Package },
  { href: "/dashboard/customers", label: "Clients", icon: Users },
  { href: "/dashboard/customize", label: "Apparence", icon: Palette },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
  { href: "/dashboard/billing", label: "Abonnement", icon: CreditCard },
];

export function Sidebar({ storeName, storeHref, pendingCount, plan }: { storeName: string; storeHref: string; pendingCount: number; plan: string }) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-full flex-col md:w-60">
      <div className="px-4 pb-2 pt-5">
        <Link href="/" className="text-sm font-bold tracking-tight">ORDELY</Link>
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <p className="truncate text-sm font-semibold">{storeName}</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{plan}</span>
            <a href={storeHref} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900">
              Voir <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto px-3 py-2 md:flex-col md:overflow-visible">
        {NAV.map((n) => {
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
