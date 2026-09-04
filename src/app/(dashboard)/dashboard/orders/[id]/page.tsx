import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft, Phone, MessageCircle, MapPin } from "lucide-react";
import { db } from "@/db";
import { orderEvents, orders } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { STATUS_META } from "@/lib/commerce";
import { wilayaByCode, ZONE_ETA, formatPhone } from "@/lib/algeria";
import { formatDZD, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/ui";
import { OrderActions } from "@/components/dashboard/OrderActions";
import { RiskCard } from "@/components/dashboard/RiskBadge";
import { getStoreRiskMap } from "@/lib/risk-data";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { store } = await requireStore();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, id), eq(orders.storeId, store.id)) });
  if (!order) notFound();
  const events = await db.query.orderEvents.findMany({ where: eq(orderEvents.orderId, order.id), orderBy: [asc(orderEvents.createdAt)] });
  const risk = (await getStoreRiskMap(store.id, [order])).get(order.id)!;
  const w = wilayaByCode(order.wilayaCode);
  const intl = order.customerPhone.replace(/^0/, "213");
  const waText = encodeURIComponent(`Bonjour ${order.customerName.split(" ")[0]}, ici ${store.name}. Nous confirmons votre commande n°${order.number} (${order.items.map((i) => i.name).join(", ")}) — total ${formatDZD(order.total)} à payer à la livraison. Confirmez-vous ?`);

  return (
    <>
      <Link href="/dashboard/orders" className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900"><ArrowLeft className="h-3.5 w-3.5" /> Commandes</Link>
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Commande #{String(order.number).padStart(4, "0")}</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-xs text-zinc-500">Reçue le {formatDateTime(order.createdAt)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="db-card overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold">Articles</div>
            <ul className="divide-y divide-zinc-100">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-4">
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-zinc-100" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{it.name}</p>
                    <p className="text-xs text-zinc-500">{it.variant ? `${it.variant} · ` : ""}{formatDZD(it.price)} × {it.qty}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatDZD(it.price * it.qty)}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-1 border-t border-zinc-100 bg-zinc-50/60 px-5 py-4 text-sm">
              <div className="flex justify-between text-zinc-600"><span>Sous-total</span><span>{formatDZD(order.subtotal)}</span></div>
              <div className="flex justify-between text-zinc-600"><span>Livraison · {order.deliveryType === "home" ? "domicile" : "point relais"}</span><span>{formatDZD(order.deliveryFee)}</span></div>
              <div className="flex justify-between pt-1 text-base font-semibold"><span>À encaisser</span><span>{formatDZD(order.total)}</span></div>
            </div>
          </div>

          <div className="db-card p-5">
            <p className="mb-4 text-sm font-semibold">Suivi</p>
            <OrderActions orderId={order.id} status={order.status} internalNote={order.internalNote} />
          </div>

          <div className="db-card p-5">
            <p className="mb-4 text-sm font-semibold">Historique</p>
            <ol className="relative ml-2 space-y-4 border-l border-zinc-200 pl-5">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${STATUS_META[e.toStatus as keyof typeof STATUS_META]?.dot ?? "bg-zinc-400"}`} />
                  <p className="text-sm font-medium">{STATUS_META[e.toStatus as keyof typeof STATUS_META]?.label ?? e.toStatus}{e.fromStatus ? <span className="text-zinc-400"> ← {STATUS_META[e.fromStatus as keyof typeof STATUS_META]?.label}</span> : null}</p>
                  {e.note && <p className="text-xs text-zinc-500">{e.note}</p>}
                  <p className="text-[11px] text-zinc-400">{formatDateTime(e.createdAt)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-6">
          <div className="db-card p-5">
            <p className="text-sm font-semibold">{order.customerName}</p>
            <p className="mt-1 text-sm text-zinc-600">{formatPhone(order.customerPhone)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={`tel:${order.customerPhone}`} className="db-btn !py-2"><Phone className="h-3.5 w-3.5" /> Appeler</a>
              <a href={`https://wa.me/${intl}?text=${waText}`} target="_blank" rel="noreferrer" className="db-btn-secondary !py-2"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
            </div>
            <div className="mt-5 flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div>
                <p className="font-medium">{w?.code} — {w?.name}, {order.commune}</p>
                {order.address && <p className="text-zinc-600">{order.address}</p>}
                <p className="mt-1 text-xs text-zinc-500">Zone {w?.zone === "north" ? "Nord" : w?.zone === "south" ? "Sud" : "Hauts plateaux"} · ETA {w ? ZONE_ETA[w.zone] : "—"}</p>
              </div>
            </div>
            {order.customerNote && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-semibold">Note du client</p>
                <p className="mt-0.5">{order.customerNote}</p>
              </div>
            )}
            {order.customerId && <Link href={`/dashboard/customers?q=${order.customerPhone}`} className="mt-4 block text-xs font-medium text-zinc-600 hover:text-zinc-900">Voir la fiche client →</Link>}
          </div>
          <RiskCard risk={risk} />
          <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-xs leading-relaxed text-zinc-500">
            <p className="font-semibold text-zinc-700">Script de confirmation</p>
            <p className="mt-1">« Bonjour {order.customerName.split(" ")[0]}, ici {store.name}. Vous avez commandé {order.items[0]?.name}. Total {formatDZD(order.total)} à payer au livreur, livraison {w ? ZONE_ETA[w.zone] : ""}. On confirme ? »</p>
          </div>
        </div>
      </div>
    </>
  );
}
