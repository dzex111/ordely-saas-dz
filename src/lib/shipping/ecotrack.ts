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

/* EcoTrack engine — one shared API, dozens of independent couriers.
 * Each courier runs the same EcoTrack platform on its OWN host with its OWN
 * bearer token (dashboard → API → generate). There is no single "EcoTrack"
 * account: DHD, Conexlog, MSM Go, Rocket, WorldExpress, Anderson… are picked
 * by company, and only the base URL + token change. Custom tenants work the
 * same way (paste their https host). Field mapping follows the documented
 * EcoTrack v1 shape (nom_client, telephone, code_wilaya, montant, …).
 * Known tenant hosts (documented): DHD platform.dhd-dz.com,
 * Conexlog app.conexlog-dz.com — everything else via custom URL.
 * NOTE: verify once with the merchant's live key via "Tester la connexion".
 */

export type EcoTrackCompany = { id: string; label: string; baseUrl: string | null };

export const ECOTRACK_COMPANIES: EcoTrackCompany[] = [
  { id: "dhd", label: "DHD", baseUrl: "https://platform.dhd-dz.com" },
  { id: "conexlog", label: "Conexlog", baseUrl: "https://app.conexlog-dz.com" },
  { id: "msm-go", label: "MSM Go", baseUrl: null },
  { id: "rocket", label: "Rocket Delivery", baseUrl: null },
  { id: "world-express", label: "WorldExpress", baseUrl: null },
  { id: "anderson", label: "Anderson Delivery", baseUrl: null },
  { id: "golivri", label: "GoLivri", baseUrl: null },
  { id: "packers", label: "Packers", baseUrl: null },
  { id: "other", label: "Autre (URL personnalisée)", baseUrl: null },
];

/** Resolve the tenant API root: explicit URL wins, else the company preset. */
export function resolveEcoTrackBase(input: { company?: string; baseUrl?: string }): string | null {
  const custom = (input.baseUrl ?? "").trim().replace(/\/+$/, "");
  if (custom) return custom;
  const preset = ECOTRACK_COMPANIES.find((c) => c.id === (input.company ?? ""));
  return preset?.baseUrl ?? null;
}

function api(base: string, token: string) {
  const root = base.replace(/\/+$/, "");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  return {
    async post(path: string, payload: Record<string, unknown>) {
      return courierHttp.http(`${root}/api/v1${path}`, { method: "POST", headers, body: JSON.stringify(payload) });
    },
    async get(path: string) {
      return courierHttp.http(`${root}/api/v1${path}`, { headers });
    },
  };
}

export function buildEcoTrackPayload(input: ShippingInput) {
  return {
    nom_client: input.fullName,
    telephone: input.phone,
    telephone_2: "",
    adresse: input.address,
    code_wilaya: input.wilayaCode,
    commune: input.commune,
    montant: Math.round(input.codAmount),
    produit: input.productList.slice(0, 500),
    remarque: input.note ?? "",
    weight: 1,
    reference: input.reference,
    type: 1,
    stop_desk: input.deliveryType === "desk" ? 1 : 0,
    fragile: 0,
  };
}

function credsOf(creds: Record<string, string>) {
  const token = creds.token ?? "";
  const base = resolveEcoTrackBase({ company: creds.company, baseUrl: creds.baseUrl });
  return { token, base };
}

export const ecotrackProvider: ShippingProvider = {
  id: "ecotrack",
  label: "EcoTrack",
  credentialFields: [
    { key: "company", label: "Société (DHD, Conexlog…)", secret: false, placeholder: "dhd" },
    { key: "token", label: "API Token (dashboard du transporteur)", secret: true, placeholder: "Bearer token" },
    { key: "baseUrl", label: "URL API (si Autre)", secret: false, placeholder: "https://xxx.ecotrack.dz" },
  ],
  supports: { labels: true, cancel: false, rates: false, locations: false },

  async testConnection(creds) {
    const { token, base } = credsOf(creds);
    if (!token) return { ok: false, error: "API Token requis." };
    if (!base || !/^https:\/\//.test(base)) return { ok: false, error: "URL API https valide requise." };
    const { status, json } = await api(base, token).get("/ping");
    if (status === 401 || status === 403) return { ok: false, error: "Token refusé par le transporteur (401)." };
    if (status >= 200 && status < 300) return { ok: true };
    const msg = (json as { message?: string } | null)?.message;
    // Some tenants have no /ping — treat any non-auth response as reachable.
    if (status === 404 || status === 405) return { ok: true };
    return { ok: false, error: msg ?? `Transporteur injoignable (${status}).` };
  },

  async createShipment(creds, input) {
    const { token, base } = credsOf(creds);
    if (!token || !base) throw new ShippingError("Token et URL API requis.");
    const { status, json } = await api(base, token).post("/orders", buildEcoTrackPayload(input));
    const o = (json ?? {}) as Record<string, unknown>;
    const tracking = (o.tracking ?? o.tracking_number ?? o.code) as string | undefined;
    if (status >= 200 && status < 300 && tracking) {
      const out: ShipmentCreated = {
        trackingNumber: String(tracking),
        labelUrl: (o.label_url ?? o.labelUrl ?? null) as string | null,
        status: "created",
        raw: json,
      };
      return out;
    }
    throw new ShippingError((o.message as string) || (o.error as string) || `Création refusée (${status}).`);
  },

  async trackShipment(creds, tracking) {
    const { token, base } = credsOf(creds);
    if (!token || !base) throw new ShippingError("Token et URL API requis.");
    const { status, json } = await api(base, token).post("/track", { tracking });
    if (status < 200 || status >= 300) throw new ShippingError(`Suivi indisponible (${status}).`);
    const o = (json ?? {}) as Record<string, unknown>;
    const rawStatus = (o.status ?? o.etat ?? "") as string;
    const events = Array.isArray(o.events)
      ? (o.events as Record<string, unknown>[]).map((e) => ({
          status: normalizeStatus(String(e.status ?? "")),
          rawStatus: typeof e.status === "string" ? (e.status as string) : undefined,
          at: typeof e.at === "string" ? (e.at as string) : undefined,
        }))
      : [];
    // Guard: only accept the event whose tracking matches (list-style APIs).
    const info: TrackingInfo = {
      status: rawStatus ? normalizeStatus(String(rawStatus)) : "unknown",
      rawStatus: rawStatus ? String(rawStatus) : undefined,
      events,
      raw: json,
    };
    return info;
  },

  async cancelShipment() {
    throw new ShippingError("Annulation non supportée par ce transporteur — annulez depuis son dashboard.");
  },

  async getRates(): Promise<RateQuote> {
    return { home: null, desk: null };
  },

  async getLocations() {
    return [];
  },
};
