import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CheckCircle2, PhoneCall, Truck, Banknote } from "lucide-react";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getStoreCtx } from "@/lib/store-ctx";
import { wilayaByCode, ZONE_ETA, formatPhone } from "@/lib/algeria";
import { formatDZD } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commande confirmée", robots: { index: false } };

export default async function ThankYou({ params }: { params: Promise<{ store: string; orderId: string }> }) {
  const { store: sub, orderId } = await params;
  const ctx = await getStoreCtx(sub);
  if (!ctx) notFound();
  const { store, base, theme } = ctx;
  if (!/^[0-9a-f-]{36}$/.test(orderId)) notFound();
  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.storeId, store.id)) });
  if (!order) notFound();
  const w = wilayaByCode(order.wilayaCode);

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--accent) 20%, transparent)", color: "var(--accent)" }}>
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <p className="mt-6 text-xs uppercase tracking-[0.3em] sf-muted">Commande n° {String(order.number).padStart(4, "0")}</p>
        <h1 className="mt-3 text-4xl md:text-5xl">Merci, {order.customerName.split(" ")[0]} !</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed sf-muted">
          Votre commande est bien reçue. Nous vous appelons au <strong style={{ color: "var(--fg)" }}>{formatPhone(order.customerPhone)}</strong> pour la confirmer avant expédition.
        </p>
      </div>

      <div className="sf-card mt-10 divide-y" style={{ borderColor: "var(--border)" }}>
        {order.items.map((it, i) => (
          <div key={i} className="flex items-center gap-4 p-5" style={{ borderColor: "var(--border)" }}>
            {it.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.image} alt="" className="h-16 w-16 rounded object-cover" style={{ borderRadius: "calc(var(--radius) * 0.5)" }} />
            )}
            <div className="flex-1">
              <p className="font-medium">{it.name}</p>
              <p className="text-xs sf-muted">
                {it.variant ? `${it.variant} · ` : ""}Qté {it.qty}
              </p>
            </div>
            <p className="font-semibold tabular-nums">{formatDZD(it.price * it.qty)}</p>
          </div>
        ))}
        <div className="space-y-1.5 p-5 text-sm" style={{ borderColor: "var(--border)" }}>
          <div className="flex justify-between sf-muted"><span>Sous-total</span><span>{formatDZD(order.subtotal)}</span></div>
          <div className="flex justify-between sf-muted"><span>Livraison ({order.deliveryType === "home" ? "domicile" : "point relais"})</span><span>{order.deliveryFee === 0 ? "Offerte" : formatDZD(order.deliveryFee)}</span></div>
          <div className="flex justify-between pt-2 text-lg font-semibold"><span>À payer au livreur</span><span>{formatDZD(order.total)}</span></div>
        </div>
        <div className="p-5 text-sm" style={{ borderColor: "var(--border)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest sf-muted">Adresse de livraison</p>
          <p className="mt-1.5">
            {order.customerName} · {w?.name ?? order.wilayaCode}, {order.commune}
            {order.address ? ` — ${order.address}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { I: PhoneCall, t: "Confirmation", d: "Appel sous 24h ouvrées" },
          { I: Truck, t: "Livraison", d: w ? `${ZONE_ETA[w.zone]} vers ${w.name}` : "Selon wilaya" },
          { I: Banknote, t: "Paiement", d: `${formatDZD(order.total)} en espèces à la réception` },
        ].map(({ I, t, d }) => (
          <div key={t} className="flex items-start gap-3 text-sm">
            <I className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
            <div>
              <p className="font-medium">{t}</p>
              <p className="text-xs sf-muted">{d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href={`${base}/#produits`} className="sf-btn">Continuer mes achats</Link>
        {theme.content.whatsapp && (
          <a href={`https://wa.me/213${theme.content.whatsapp.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(`Bonjour, je viens de passer la commande n°${order.number} sur ${store.name}.`)}`} target="_blank" rel="noreferrer" className="sf-btn-ghost">
            Nous écrire sur WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
