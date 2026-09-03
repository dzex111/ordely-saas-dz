import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink text-white lg:block">
        <div className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(60% 60% at 20% 20%, #ff5a1f55, transparent 60%), radial-gradient(50% 50% at 90% 80%, #7c5cff44, transparent 60%)" }} />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="text-lg font-semibold tracking-tight">ORDELY</Link>
          <div>
            <p className="max-w-md text-4xl font-semibold leading-tight tracking-tight">Chaque marchand paraît premium en 10 minutes.</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">Boutique multi-templates, checkout paiement à la livraison sur 58 wilayas, tableau de bord complet. Aucune carte requise.</p>
          </div>
          <div className="flex gap-8 text-xs text-white/50">
            <span>7 templates d’agence</span><span>COD natif</span><span>Supabase-ready</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 block text-sm font-semibold tracking-tight lg:hidden">ORDELY</Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mb-8 mt-1.5 text-sm text-zinc-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
