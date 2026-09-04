import {
  normalizeStatus,
  ShippingError,
  courierHttp,
  type RateQuote,
  type ShipmentCreated,
  type ShipmentStatus,
  type ShippingInput,
  type ShippingProvider,
  type TrackingInfo,
} from "./types";

/* Yalidine — https://api.yalidine.app/v1 (X-API-ID + X-API-TOKEN).
 * Field mapping per Yalidine public API docs + community SDKs
 * (TerminalDZ/laravel-yalidine, feeefapp/yalidine, Darknab/yalidine-sdk).
 * Docs: https://yalidine.app/app/dev/docs/api/index.php
 * NOTE: verify field names once with the merchant's live key via "Tester la connexion".
 */

const BASE = "https://api.yalidine.app/v1";
// Endpoint paths below follow the documented parcels/histories resources.
const PATHS = {
  parcels: "/parcels",
  histories: "/histories",
  communes: "/communes",
  fees: "/fees",
} as const;

function headers(creds: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    "X-API-ID": creds.apiId ?? "",
    "X-API-TOKEN": creds.apiToken ?? "",
  };
}

function splitName(fullName: string): { firstname: string; familyname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstname: parts[0], familyname: parts[0] };
  return { firstname: parts.slice(0, -1).join(" "), familyname: parts[parts.length - 1] };
}

export function buildYalidinePayload(input: ShippingInput) {
  const { firstname, familyname } = splitName(input.fullName);
  return {
    order_id: input.reference,
    from_wilaya_name: input.fromWilaya ?? "",
    firstname,
    familyname,
    contact_phone: input.phone,
    address: input.address,
    to_commune_name: input.commune,
    to_wilaya_name: input.wilayaName,
    product_list: input.productList.slice(0, 500),
    price: Math.round(input.codAmount),
    do_insurance: false,
    declared_value: Math.round(input.codAmount),
    length: 30,
    width: 20,
    height: 10,
    weight: 1,
    freeshipping: false,
    is_stopdesk: input.deliveryType === "desk",
    has_exchange: false,
  };
}

function toStatus(raw: unknown): ShipmentStatus {
  if (typeof raw === "string") return normalizeStatus(raw);
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const k of ["last_status", "status", "etat", "state"]) {
      if (typeof o[k] === "string") return normalizeStatus(o[k] as string);
    }
  }
  return "unknown";
}

export const yalidineProvider: ShippingProvider = {
  id: "yalidine",
  label: "Yalidine",
  credentialFields: [
    { key: "apiId", label: "API ID", secret: false, placeholder: "Ex : 123456" },
    { key: "apiToken", label: "API Token", secret: true, placeholder: "Token du dashboard Yalidine" },
    { key: "fromWilaya", label: "Wilaya d’expédition (ex : Alger)", secret: false, placeholder: "Alger" },
  ],
  supports: { labels: true, cancel: true, rates: true, locations: true },

  async testConnection(creds) {
    if (!creds.apiId || !creds.apiToken) return { ok: false, error: "API ID et API Token requis." };
    // Authenticated lightweight read: wrong keys → 401, right keys → 200 (maybe empty).
    const { status, json } = await courierHttp.http(`${BASE}${PATHS.parcels}?page=1&page_size=1`, { headers: headers(creds) });
    if (status === 401 || status === 403) return { ok: false, error: "Identifiants refusés par Yalidine (401)." };
    if (status >= 200 && status < 300) return { ok: true };
    const msg = (json as { message?: string } | null)?.message;
    return { ok: false, error: msg ?? `Yalidine a répondu ${status}.` };
  },

  async createShipment(creds, input) {
    const { status, json } = await courierHttp.http(`${BASE}${PATHS.parcels}`, {
      method: "POST",
      headers: headers(creds),
      body: JSON.stringify(buildYalidinePayload(input)),
    });
    const o = (json ?? {}) as Record<string, unknown>;
    const tracking = (o.tracking ?? o.tracking_number ?? o.code) as string | undefined;
    if (status >= 200 && status < 300 && tracking) {
      const out: ShipmentCreated = {
        trackingNumber: String(tracking),
        labelUrl: (o.label as string | undefined) ?? null,
        status: toStatus(o),
        raw: json,
      };
      return out;
    }
    throw new ShippingError((o.message as string) || `Création refusée par Yalidine (${status}).`);
  },

  async trackShipment(creds, tracking) {
    const { status, json } = await courierHttp.http(`${BASE}${PATHS.parcels}/${encodeURIComponent(tracking)}`, {
      headers: headers(creds),
    });
    if (status === 404) {
      const info: TrackingInfo = { status: "unknown", rawStatus: "introuvable", events: [], raw: json };
      return info;
    }
    if (status < 200 || status >= 300) throw new ShippingError(`Suivi Yalidine indisponible (${status}).`);
    const o = (json ?? {}) as Record<string, unknown>;
    const hist = Array.isArray(o.histories) ? (o.histories as Record<string, unknown>[]) : [];
    const info: TrackingInfo = {
      status: toStatus(o),
      rawStatus: typeof o.last_status === "string" ? (o.last_status as string) : undefined,
      events: hist.map((h) => ({
        status: toStatus(h),
        rawStatus: typeof h.status === "string" ? (h.status as string) : undefined,
        at: typeof h.date === "string" ? (h.date as string) : undefined,
      })),
      raw: json,
    };
    return info;
  },

  async cancelShipment(creds, tracking) {
    const { status, json } = await courierHttp.http(`${BASE}${PATHS.parcels}/${encodeURIComponent(tracking)}`, {
      method: "DELETE",
      headers: headers(creds),
    });
    if (status >= 200 && status < 300) return;
    throw new ShippingError(((json as { message?: string } | null)?.message) || `Annulation refusée (${status}).`);
  },

  async getRates(creds, wilayaCode): Promise<RateQuote> {
    const { status, json } = await courierHttp.http(`${BASE}${PATHS.fees}?to_wilaya_id=${encodeURIComponent(wilayaCode)}`, {
      headers: headers(creds),
    });
    if (status < 200 || status >= 300) return { home: null, desk: null };
    const o = (Array.isArray(json) ? json[0] : json ?? {}) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || null);
    return {
      home: num(o.home_fee ?? o.home ?? o.domicile),
      desk: num(o.desk_fee ?? o.desk ?? o.stopdesk),
    };
  },

  async getLocations(creds) {
    const { status, json } = await courierHttp.http(`${BASE}${PATHS.communes}`, { headers: headers(creds) });
    if (status < 200 || status >= 300 || !Array.isArray(json)) return [];
    const byWilaya = new Map<string, Set<string>>();
    for (const c of json as Record<string, unknown>[]) {
      const w = String(c.wilaya_id ?? c.wilaya ?? "");
      const name = String(c.commune_name ?? c.name ?? "");
      if (!w || !name) continue;
      if (!byWilaya.has(w)) byWilaya.set(w, new Set());
      byWilaya.get(w)!.add(name);
    }
    return [...byWilaya].map(([wilayaCode, set]) => ({ wilayaCode, communes: [...set] }));
  },
};
