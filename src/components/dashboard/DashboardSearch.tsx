"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Package, Search, ShoppingBag, Users } from "lucide-react";
import { formatDZD } from "@/lib/utils";

type Results = {
  orders: { id: string; number: number; customerName: string; customerPhone: string; total: number; status: string }[];
  products: { id: string; name: string; price: number; stock: number | null }[];
  customers: { id: string; name: string; phone: string; ordersCount: number }[];
};

/** Global dashboard search — orders, products, customers. */
export function DashboardSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Results | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setRes(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/dashboard/search?q=${encodeURIComponent(q.trim())}`);
        const j = await r.json();
        if (j.ok) setRes({ orders: j.orders, products: j.products, customers: j.customers });
      } catch {
        // ignore — search is best-effort
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const empty = res && !res.orders.length && !res.products.length && !res.customers.length;

  return (
    <div ref={box} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Rechercher commande, produit, client…"
        className="db-input !pl-9"
      />
      {open && (loading || res) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
          {loading && !res ? (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> Recherche…</p>
          ) : empty ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Aucun résultat pour « {q.trim()} ».</p>
          ) : (
            <div className="max-h-80 overflow-auto py-1.5">
              {res!.orders.length > 0 && (
                <div>
                  <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Commandes</p>
                  {res!.orders.map((o) => (
                    <Link key={o.id} href={`/dashboard/orders/${o.id}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 transition hover:bg-zinc-50">
                      <ShoppingBag className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">#{String(o.number).padStart(4, "0")} — {o.customerName}</span>
                        <span className="block text-xs text-zinc-500">{o.customerPhone}</span>
                      </span>
                      <span className="text-xs font-semibold tabular-nums">{formatDZD(o.total)}</span>
                    </Link>
                  ))}
                </div>
              )}
              {res!.products.length > 0 && (
                <div>
                  <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Produits</p>
                  {res!.products.map((p) => (
                    <Link key={p.id} href={`/dashboard/products/${p.id}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 transition hover:bg-zinc-50">
                      <Package className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                      <span className="text-xs font-semibold tabular-nums">{formatDZD(p.price)}</span>
                    </Link>
                  ))}
                </div>
              )}
              {res!.customers.length > 0 && (
                <div>
                  <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Clients</p>
                  {res!.customers.map((c) => (
                    <Link key={c.id} href={`/dashboard/orders?q=${encodeURIComponent(c.phone)}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 transition hover:bg-zinc-50">
                      <Users className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{c.name}</span>
                        <span className="block text-xs text-zinc-500">{c.phone} · {c.ordersCount} cmd</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
