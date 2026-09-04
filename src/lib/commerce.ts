import type { OrderStatus, StoreSettings } from "@/db/schema";
import type { ShipmentStatus } from "@/lib/shipping/types";

export function computeDeliveryFee(settings: StoreSettings, wilayaCode: string, type: "home" | "desk", subtotal: number) {
  if (settings.freeShippingThreshold !== null && subtotal >= settings.freeShippingThreshold) return 0;
  const override = settings.rateOverrides?.[wilayaCode];
  if (override) return type === "home" ? override.home : override.desk;
  return type === "home" ? settings.homeDeliveryFee : settings.deskDeliveryFee;
}

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  returned: [],
  cancelled: ["pending"],
};

/** Order status a shipment status may auto-apply during the daily tracking sync.
 *  pending→confirmed stays merchant-gated: the courier says nothing about confirmation. */
export function orderTargetFromShipment(s: ShipmentStatus): OrderStatus | null {
  if (s === "delivered") return "delivered";
  if (s === "returned") return "returned";
  if (s === "picked" || s === "transit") return "shipped";
  return null;
}

export const STATUS_META: Record<OrderStatus, { label: string; verb: string; tone: string; dot: string }> = {
  pending: { label: "À confirmer", verb: "Remettre en attente", tone: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  confirmed: { label: "Confirmée", verb: "Confirmer", tone: "bg-sky-50 text-sky-800 ring-sky-200", dot: "bg-sky-500" },
  shipped: { label: "Expédiée", verb: "Expédier", tone: "bg-violet-50 text-violet-800 ring-violet-200", dot: "bg-violet-500" },
  delivered: { label: "Livrée", verb: "Marquer livrée", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  returned: { label: "Retournée", verb: "Marquer retournée", tone: "bg-rose-50 text-rose-800 ring-rose-200", dot: "bg-rose-500" },
  cancelled: { label: "Annulée", verb: "Annuler", tone: "bg-zinc-100 text-zinc-700 ring-zinc-200", dot: "bg-zinc-400" },
};

