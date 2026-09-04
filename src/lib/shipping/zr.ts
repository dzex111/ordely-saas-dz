import {
  normalizeStatus,
  ShippingError,
  courierHttp,
  type RateQuote,
  type ShipmentCreated,
  type ShippingInput,
  type ShippingProvider,
  type TrackingInfo,
} from "./types";

/* ZR Express (Procolis engine) — https://procolis.com/api_v1
 * Credentials: Token + Key (dashboard → Paramètres → Info personnelles).
 * Documented quirks (community integrations — uften/courier, tkawen/shipping-dz,
 * PiteurStudio/CourrierDZ, Odoo dz_zr_express):
 * - reads go through POST calls, not GET;
 * - NO label endpoint (labels print from the ZR dashboard);
 * - NO cancel endpoint (cancel from the dashboard);
 * - push orders only AFTER phone confirmation, or cancelled parcels pile up.
 * Create payload shape follows the documented Procolis order fields.
 * NOTE: verify once with the merchant's live keys via "Tester la connexion".
 */

const BASE = "https://procolis.com/api_v1";
const PATHS = {
  create: "/create-order",
  track: "/tracking",
  test: "/test-credentials",
} as const;

function body(creds: Record<string, string>, extra: Record<string, unknown> = {}) {
  return {
    token: creds.token ?? "",
    key: creds.key ?? "",
    id: creds.token ?? "",
    ...extra,
  };
}

export function buildZrPayload(input: ShippingInput) {
  return {
    Tracking: input.reference,
    TypeLivraison: input.deliveryType === "desk" ? 0 : 1,
    TypeColis: 0,
    Confrimee: 1, // ORDELY only pushes phone-confirmed orders
    Client: input.fullName,
    MobileA: input.phone,
    MobileB: "",
    Adresse: input.address,
    IDWilaya: input.wilayaCode,
    Commune: input.commune,
    Total: String(Math.round(input.codAmount)),
    Note: input.note ?? "",
    TProduit: input.productList.slice(0, 300),
    id_Externe: input.reference,
    Source: "Ordely",
  };
}

export const zrProvider: ShippingProvider = {
  id: "zr",
  label: "ZR Express",
  credentialFields: [
    { key: "token", label: "API Token", secret: true, placeholder: "Token (Paramètres → Info personnelles)" },
    { key: "key", label: "API Key", secret: true, placeholder: "Clé API" },
  ],
  supports: { labels: false, cancel: false, rates: false, locations: false },

  async testConnection(creds) {
    if (!creds.token || !creds.key) return { ok: false, error: "Token et Key requis." };
    const { status, json } = await courierHttp.http(`${BASE}${PATHS.test}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body(creds)),
    });
    if (status === 401 || status === 403) return { ok: false, error: "Identifiants refusés par ZR Express (401)." };
    if (status >= 200 && status < 300) {
      const o = (json ?? {}) as Record<string, unknown>;
      if (o.success === false || o.error) return { ok: false, error: String(o.error ?? o.message ?? "Échec de connexion.") };
      return { ok: true };
    }
    return { ok: false, error: `ZR Express a répondu ${status}.` };
  },

  async createShipment(creds, input) {
    const { status, json } = await courierHttp.http(`${BASE}${PATHS.create}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body(creds, buildZrPayload(input))),
    });
    const o = (json ?? {}) as Record<string, unknown>;
    const tracking = (o.tracking ?? o.tracking_number ?? o.code_colis) as string | undefined;
    if (status >= 200 && status < 300 && tracking) {
      const out: ShipmentCreated = { trackingNumber: String(tracking), labelUrl: null, status: "created", raw: json };
      return out;
    }
    throw new ShippingError((o.error as string) || (o.message as string) || `Création refusée par ZR Express (${status}).`);
  },

  async trackShipment(creds, tracking) {
    const { status, json } = await courierHttp.http(`${BASE}${PATHS.track}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body(creds, { tracking })),
    });
    if (status < 200 || status >= 300) throw new ShippingError(`Suivi ZR Express indisponible (${status}).`);
    const o = (json ?? {}) as Record<string, unknown>;
    const rawStatus = (o.statut ?? o.status ?? o.etat ?? "") as string;
    const info: TrackingInfo = {
      status: rawStatus ? normalizeStatus(String(rawStatus)) : "unknown",
      rawStatus: rawStatus ? String(rawStatus) : undefined,
      events: [],
      raw: json,
    };
    return info;
  },

  async cancelShipment() {
    throw new ShippingError("ZR Express ne propose pas d’annulation par API — annulez depuis le dashboard ZR.");
  },

  async getRates(): Promise<RateQuote> {
    return { home: null, desk: null };
  },

  async getLocations() {
    return [];
  },
};
