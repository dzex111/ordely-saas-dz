import type { Metadata } from "next";
import type { ReactNode } from "react";
import { allFontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ORDELY — Boutiques COD premium pour l’Algérie", template: "%s · ORDELY" },
  description:
    "Créez une boutique premium en 10 minutes, recevez des commandes contre-remboursement dans les 58 wilayas. Templates d’agence, checkout COD, tableau de bord complet.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={allFontVariables}>
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
