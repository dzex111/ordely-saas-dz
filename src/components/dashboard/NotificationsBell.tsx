"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

export type BellItem = {
  id: string;
  title: string;
  body: string;
  link: string;
  time: string;
  read: boolean;
  kind: "info" | "warn" | "alert";
};

const DOT: Record<BellItem["kind"], string> = {
  info: "bg-sky-500",
  warn: "bg-amber-500",
  alert: "bg-rose-500",
};

/** Real notifications center — unread badge, clickable items, mark-all-read. */
export function NotificationsBell({ items, unread }: { items: BellItem[]; unread: number }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
            {open && (
        <div className="absolute right-0 top-full z-[100] mt-2 w-[340px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() => start(async () => {
                  await markAllNotificationsRead();
                  router.refresh();
                })}
                className="flex items-center gap-1 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-auto py-1.5">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">Rien à signaler. Bonne vente !</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "/dashboard"}
                  onClick={() => {
                    if (!n.read && !n.id.startsWith("sys-")) start(async () => { await markNotificationRead(n.id); });
                    setOpen(false);
                  }}
                  className={cn("flex gap-3 px-4 py-2.5 transition hover:bg-zinc-50", !n.read && "bg-zinc-50/70")}
                >
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT[n.kind])} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{n.title}</span>
                    {n.body && <span className="block truncate text-xs text-zinc-500">{n.body}</span>}
                    <span className="block text-[11px] text-zinc-400">{n.time}</span>
                  </span>
                  {!n.read && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-900" />}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
