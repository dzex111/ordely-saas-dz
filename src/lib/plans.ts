import type { PlanId } from "@/db/schema";

export type Plan = {
  id: PlanId;
  name: string;
  priceMonthly: number; // DZD
  priceUsd: number;
  description: string;
  productLimit: number | null;
  orderLimit: number | null; // per month
  features: string[];
  highlight?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 0,
    priceUsd: 0,
    description: "Pour lancer votre première boutique et valider votre produit.",
    productLimit: 10,
    orderLimit: 50,
    features: ["1 boutique", "7 templates", "10 produits", "50 commandes / mois", "Checkout COD", "Sous-domaine ORDELY"],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 1900,
    priceUsd: 14,
    description: "Pour les marques qui vendent tous les jours.",
    productLimit: 200,
    orderLimit: 2000,
    features: ["Tout Starter", "200 produits", "2 000 commandes / mois", "Domaine personnalisé", "Tarifs livraison par wilaya", "Export CSV", "Support WhatsApp", "Analytics / Pixel"],
    highlight: true,
  },
  {
    id: "scale",
    name: "Scale",
    priceMonthly: 4900,
    priceUsd: 36,
    description: "Pour les opérations multi-produits à fort volume.",
    productLimit: null,
    orderLimit: null,
    features: ["Tout Growth", "Produits & commandes illimités", "Intégrations Yalidine / ZR / Maystro", "Multi-utilisateurs", "Analytics avancés", "Account manager"],
  },
];

export const getPlan = (id: PlanId) => PLANS.find((p) => p.id === id) ?? PLANS[0];
