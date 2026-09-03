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
    orderLimit: 100,
    features: ["1 boutique · sous-domaine ordely", "7 templates premium", "10 produits", "100 commandes / mois", "Checkout COD 58 wilayas"],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 2900,
    priceUsd: 19,
    description: "Pour les marques qui vendent tous les jours.",
    productLimit: 200,
    orderLimit: 2000,
    features: ["Tout Starter", "200 produits", "2 000 commandes / mois", "Nom de domaine personnalisé", "Tarifs de livraison par wilaya", "Export commandes CSV", "Support prioritaire WhatsApp"],
    highlight: true,
  },
  {
    id: "scale",
    name: "Scale",
    priceMonthly: 7900,
    priceUsd: 49,
    description: "Pour les opérations multi-produits à fort volume.",
    productLimit: null,
    orderLimit: null,
    features: ["Tout Growth", "Produits & commandes illimités", "Intégrations transporteurs (Yalidine, ZR, Maystro)", "Multi-utilisateurs", "Pixel & analytics avancés", "Account manager dédié"],
  },
];

export const getPlan = (id: PlanId) => PLANS.find((p) => p.id === id) ?? PLANS[0];
