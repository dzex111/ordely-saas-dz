import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { shippingCredentials } from "@/db/schema";
import { requireStore } from "@/lib/auth";
import { denyUnless } from "@/lib/team";
import { hasFeature } from "@/lib/plans";
import { formatDate } from "@/lib/utils";
import { isSupabaseConfigured, isSupabaseStorageConfigured } from "@/lib/supabase";
import { PageHeader } from "@/components/dashboard/ui";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { StoreIdBox } from "@/components/dashboard/StoreIdBox";
import { CustomDomainPanel } from "@/components/dashboard/CustomDomainPanel";
import { ShippingPanel } from "@/components/dashboard/ShippingPanel";
import { DeleteStorePanel } from "@/components/dashboard/DeleteStorePanel";

export default async function SettingsPage() {
  const { store, user } = await requireStore();
  if (await denyUnless(store, user, "manageSettings")) redirect("/dashboard");
  const sb = isSupabaseConfigured();
  const sbs = isSupabaseStorageConfigured();
  const shipCreds = await db.query.shippingCredentials.findMany({ where: eq(shippingCredentials.storeId, store.id) });
  return (
    <>
      <PageHeader title="Paramètres" description="Adresse, publication, frais de livraison par wilaya." />
      {store.suspended && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          <p className="font-semibold">Boutique suspendue par l’admin.</p>
          <p className="mt-1 text-xs leading-relaxed">Votre boutique est hors ligne et le restera même si vous la republiez. Contactez l’admin via la page Contact pour régulariser la situation.</p>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SettingsForm key={store.updatedAt.toISOString()} store={store} />
          {store.ownerId === user.id && <DeleteStorePanel storeName={store.name} />}
        </div>
        <div className="space-y-4">
          {store.publicId && <StoreIdBox publicId={store.publicId} />}
          <CustomDomainPanel domain={store.customDomain} status={store.customDomainStatus} canUse={hasFeature(store.plan, "customDomain")} />
          <ShippingPanel
            canUse={hasFeature(store.plan, "shippingIntegrations")}
            creds={shipCreds.map((c) => ({ id: c.id, provider: c.provider, company: c.company, label: c.label, ok: c.lastTestOk, at: c.lastTestAt ? formatDate(c.lastTestAt) : null }))}
          />
          <div className="db-card p-5 text-sm">
            <p className="font-semibold">Infrastructure</p>
            <ul className="mt-3 space-y-2 text-xs text-zinc-600">
              <li className="flex items-center justify-between"><span>Base de données</span><span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">PostgreSQL</span></li>
              <li className="flex items-center justify-between"><span>Authentification</span><span className={`rounded px-1.5 py-0.5 font-medium ${sb ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>{sb ? "Supabase Auth" : "Sessions intégrées"}</span></li>
              <li className="flex items-center justify-between"><span>Médias</span><span className={`rounded px-1.5 py-0.5 font-medium ${sbs ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>{sbs ? "Supabase Storage" : "Postgres (fallback)"}</span></li>
            </ul>
            {!sb && <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">Renseignez <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> et <code>SUPABASE_SERVICE_ROLE_KEY</code> dans <code>.env</code> pour basculer automatiquement sur Supabase.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
