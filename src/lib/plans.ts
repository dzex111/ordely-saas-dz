import type { PlanId } from "@/db/schema";

/* ==========================================================================
 * ORDELY — Central plan configuration (single source of truth).
 *
 * To change a price, a limit or an AI quota, edit ONLY the PLANS array below.
 * All enforcement (server actions), UI (pricing cards, dashboard) and the
 * Telegram admin bot read from here. Nothing is scattered across the codebase.
 * ========================================================================== */

export type PlanLimits = {
  stores: number; // max boutiques per merchant
  productsPerStore: number | null; // null = unlimited
  ordersPerMonth: number | null; // per Africa/Algiers calendar month, null = unlimited
  users: number; // team seats (enforced once team management ships)
  aiConfirmationsPerMonth: number; // included AI credits; NEVER unlimited (0 = none)
};

export const FEATURE_KEYS = [
  "orderManagement",
  "customerManagement",
  "dashboard",
  "codConfirmation",
  "duplicateDetection",
  "basicFraud",
  "customDomain",
  "teamManagement",
  "roles",
  "csvExport",
  "advancedAnalytics",
  "aiChatbot",
  "aiConfirmation",
  "whatsappBasic",
  "shippingIntegrations",
  "shipmentCreation",
  "tracking",
  "bulkShipping",
  "basicAutomation",
  "advancedAutomation",
  "autoReminders",
  "confirmationWorkflows",
  "riskScoring",
  "humanEscalation",
  "multiStore",
  "storeComparison",
  "prioritySupport",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number; // DZD
  description: string;
  cta: string;
  highlight?: boolean;
  badge?: string;
  limits: PlanLimits;
  /** Concise card list (FR). Unimplemented roadmap items carry "(bientôt)" — never fake. */
  features: string[];
  flags: Record<FeatureKey, boolean>;
};

const base: Record<FeatureKey, boolean> = {
  orderManagement: false,
  customerManagement: false,
  dashboard: false,
  codConfirmation: false,
  duplicateDetection: false,
  basicFraud: false,
  customDomain: false,
  teamManagement: false,
  roles: false,
  csvExport: false,
  advancedAnalytics: false,
  aiChatbot: false,
  aiConfirmation: false,
  whatsappBasic: false,
  shippingIntegrations: false,
  shipmentCreation: false,
  tracking: false,
  bulkShipping: false,
  basicAutomation: false,
  advancedAutomation: false,
  autoReminders: false,
  confirmationWorkflows: false,
  riskScoring: false,
  humanEscalation: false,
  multiStore: false,
  storeComparison: false,
  prioritySupport: false,
};

const starterFlags: Record<FeatureKey, boolean> = {
  ...base,
  orderManagement: true,
  customerManagement: true,
  dashboard: true,
  codConfirmation: true,
  duplicateDetection: true,
  basicFraud: true,
};

const proFlags: Record<FeatureKey, boolean> = {
  ...starterFlags,
  customDomain: true,
  teamManagement: true,
  roles: true,
  csvExport: true,
  advancedAnalytics: true,
  aiChatbot: true,
  aiConfirmation: true,
  whatsappBasic: true,
  shippingIntegrations: true,
  shipmentCreation: true,
  tracking: true,
  basicAutomation: true,
};

const businessFlags: Record<FeatureKey, boolean> = {
  ...proFlags,
  advancedAutomation: true,
  autoReminders: true,
  confirmationWorkflows: true,
  riskScoring: true,
  humanEscalation: true,
  multiStore: true,
  storeComparison: true,
  bulkShipping: true,
  prioritySupport: true,
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Gratuit pour toujours.",
    priceMonthly: 0,
    description: "Gratuit pour toujours. Lancez votre boutique sans risque.",
    cta: "Commencer gratuitement",
    limits: { stores: 1, productsPerStore: 10, ordersPerMonth: 50, users: 1, aiConfirmationsPerMonth: 0 },
    features: [
      "1 boutique",
      "10 produits",
      "50 commandes / mois",
      "1 utilisateur",
      "7 templates",
      "Checkout COD",
      "Gestion des commandes",
      "Gestion des clients",
      "Tableau de bord",
      "Sous-domaine ORDELY",
    ],
    flags: starterFlags,
  },
  {
    id: "pro",
    name: "PRO",
    tagline: "Le plan principal.",
    priceMonthly: 499,
    description: "Tout ce qu'il faut pour développer votre business COD.",
    cta: "Passer à PRO",
    highlight: true,
    badge: "POPULAIRE",
    limits: { stores: 1, productsPerStore: 100, ordersPerMonth: 500, users: 3, aiConfirmationsPerMonth: 100 },
    features: [
      "Tout Starter",
      "100 produits",
      "500 commandes / mois",
      "3 utilisateurs",
      "Domaine personnalisé",
      "Gestion avancée des commandes",
      "Historique clients",
      "Gestion d'équipe",
      "Rôles et permissions",
      "Export CSV",
      "Analytics avancés",
      "Confirmation des commandes",
      "Détection des commandes en double",
      "Protection anti-fraude de base",
      "Risk scoring",
      "Intégrations livraison (bientôt)",
      "Numéro de tracking (bientôt)",
    ],
    flags: proFlags,
  },
  {
    id: "business",
    name: "BUSINESS",
    tagline: "Pour passer à l'échelle.",
    priceMonthly: 1499,
    description: "Automatisez vos opérations COD et passez à l'échelle.",
    cta: "Passer à BUSINESS",
    limits: { stores: 3, productsPerStore: 500, ordersPerMonth: 2000, users: 10, aiConfirmationsPerMonth: 500 },
    features: [
      "Tout PRO",
      "3 boutiques",
      "500 produits / boutique",
      "2 000 commandes / mois",
      "10 utilisateurs",
      "Multi-boutiques",
      "Permissions avancées",
      "Comparaison entre boutiques",
      "AI Chatbot (bientôt)",
      "AI Confirmation Arabe / Français (bientôt)",
      "Automatisations avancées (bientôt)",
      "Relances automatiques (bientôt)",
      "Bulk shipping (bientôt)",
      "Support prioritaire",
    ],
    flags: businessFlags,
  },
];

export const getPlan = (id: PlanId): Plan => PLANS.find((p) => p.id === id) ?? PLANS[0];

/** Next paid tier for upgrade CTAs (null when already on top). */
export function nextPlan(id: PlanId): Plan | null {
  if (id === "starter") return getPlan("pro");
  if (id === "pro") return getPlan("business");
  return null;
}

/** "Passer à PRO — 499 DA/mois" or "" when already on top. */
export function upgradeCta(id: PlanId): string {
  const next = nextPlan(id);
  return next ? `Passer à ${next.name} — ${next.priceMonthly.toLocaleString("fr-FR")} DA/mois` : "";
}

export function hasFeature(id: PlanId, key: FeatureKey): boolean {
  return getPlan(id).flags[key];
}

/** Start (inclusive) of the Africa/Algiers calendar month containing `now`.
 *  Deterministic across servers regardless of their local timezone. */
export function startOfBillingMonth(now: Date = new Date(), timeZone = "Africa/Algiers"): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "01";
  // Offset of the target zone at the 1st of the local month (handles DST).
  const guess = Date.UTC(Number(get("year")), Number(get("month")) - 1, 1);
  const probe = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset", hour12: false }).format(new Date(guess + 12 * 3600_000));
  const m = probe.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const sign = m?.[1] === "-" ? -1 : 1;
  const offMin = sign * ((Number(m?.[2] ?? 0) * 60) + Number(m?.[3] ?? 0));
  return new Date(guess - offMin * 60_000);
}
