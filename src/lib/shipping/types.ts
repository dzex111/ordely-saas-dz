/* Unified Shipping Provider Layer.
 *
 * ORDELY never pays shipping and never middlemans parcels: the merchant brings
 * their own courier account, we manage + track. Every courier is an Adapter
 * behind this single interface — adding a company later (Noest, …) means
 * adding one adapter file, never touching orders again.
 *
 *   createShipment() · trackShipment() · getRates() · cancelShipment() · getLocations()
 */

export type ProviderId = "yalidine" | "zr" | "ecotrack";

export type ShipmentStatus =
  | "created"
  | "picked"
  | "transit"
  | "delivered"
  | "returned"
  | "cancelled"
  | "failed"
  | "unknown";

export type ShippingInput = {
  reference: string; // our order number, e.g. ORD-0042
  fullName: string;
  phone: string;
  address: string;
  commune: string;
  wilayaCode: string; // "16"
  wilayaName: string; // French Latin name (couriers expect it)
  deliveryType: "home" | "desk";
  productList: string; // printed on the label
  codAmount: number; // DZD to collect, 0 = prepaid
  note?: string;
  fromWilaya?: string; // origin wilaya name (Yalidine requires it)
  company?: string; // EcoTrack tenant company id (dhd, conexlog, …)
};

export type ShipmentCreated = {
  trackingNumber: string;
  labelUrl?: string | null;
  status: ShipmentStatus;
  raw: unknown;
};

export type TrackingEvent = { status: ShipmentStatus; rawStatus?: string; at?: string };

export type TrackingInfo = {
  status: ShipmentStatus;
  rawStatus?: string;
  events: TrackingEvent[];
  raw: unknown;
};

export type RateQuote = { home: number | null; desk: number | null };

export type CredentialField = { key: string; label: string; secret: boolean; placeholder?: string };

export type ShippingProvider = {
  id: ProviderId;
  label: string;
  credentialFields: CredentialField[];
  supports: { labels: boolean; cancel: boolean; rates: boolean; locations: boolean };
  testConnection: (creds: Record<string, string>) => Promise<{ ok: true } | { ok: false; error: string }>;
  createShipment: (creds: Record<string, string>, input: ShippingInput) => Promise<ShipmentCreated>;
  trackShipment: (creds: Record<string, string>, tracking: string) => Promise<TrackingInfo>;
  cancelShipment: (creds: Record<string, string>, tracking: string) => Promise<void>;
  getRates: (creds: Record<string, string>, wilayaCode: string) => Promise<RateQuote>;
  getLocations: (creds: Record<string, string>) => Promise<{ wilayaCode: string; communes: string[] }[]>;
};

export class ShippingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShippingError";
  }
}

/** Normalize any courier raw status wording to our vocabulary. */
export function normalizeStatus(raw: string): ShipmentStatus {
  const s = (raw ?? "").toLowerCase();
  // NB: "livraison" (noun) means IN delivery → transit; only livré/livrée = delivered.
  if (/(^|\W)livr[ée]e?(\W|$)|delivered|received|remis|\bcomplete\b/.test(s)) return "delivered";
  if (/(retour|return|récup|refus)/.test(s)) return "returned";
  if (/(annul|cancel)/.test(s)) return "cancelled";
  if (/(échec|fail|perdu|lost)/.test(s)) return "failed";
  if (/(ramass|pick|collect|prise en charge)/.test(s)) return "picked";
  if (/(transit|expédi|achemin|en cours|sorti|livraison|dispatch)/.test(s)) return "transit";
  if (/(cré|create|enregistr|nouveau|pending|received)/.test(s)) return "created";
  return "unknown";
}

async function http(url: string, init: RequestInit, timeoutMs = 25000): Promise<{ status: number; json: unknown }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const json = (await res.json().catch(() => null)) as unknown;
    return { status: res.status, json };
  } finally {
    clearTimeout(t);
  }
}

export const courierHttp = { http };
