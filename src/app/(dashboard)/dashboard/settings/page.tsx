import { requireStore } from "@/lib/auth";
import { isSupabaseConfigured, isSupabaseStorageConfigured } from "@/lib/supabase";
import { PageHeader } from "@/components/dashboard/ui";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { StoreIdBox } from "@/components/dashboard/StoreIdBox";

export default async function SettingsPage() {
  const { store } = await requireStore();
  const sb = isSupabaseConfigured();
  const sbs = isSupabaseStorageConfigured();
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
        <div className="lg:col-span-2"><SettingsForm key={store.updatedAt.toISOString()} store={store} /></div>
        <div className="space-y-4">
          {store.publicId && <StoreIdBox publicId={store.publicId} />}
          <div className="db-card p-5 text-sm">
            <p className="font-semibold">Infrastructure</p>
            <ul className="mt-3 space-y-2 text-xs text-zinc-600">
              <li className="flex items-center justify-between"><span>Base de données</span><span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">PostgreSQL</span></li>
              <li className="flex items-center justify-between"><span>Authentification</span><span className={`rounded px-1.5 py-0.5 font-medium ${sb ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>{sb ? "Supabase Auth" : "Sessions intégrées"}</span></li>
              <li className="flex items-center justify-between"><span>Médias</span><span className={`rounded px-1.5 py-0.5 font-medium ${sbs ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>{sbs ? "Supabase Storage" : "Postgres (fallback)"}</span></li>
            </ul>
            {!sb && <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">Renseignez <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> et <code>SUPABASE_SERVICE_ROLE_KEY</code> dans <code>.env</code> pour basculer automatiquement sur Supabase.</p>}
          </div>
          <div className="db-card p-5 text-sm">
            <p className="font-semibold">Domaine personnalisé</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">Disponible sur Growth. Pointez un CNAME vers <code>{process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ordely.app"}</code> puis contactez le support pour l’activation SSL.</p>
          </div>
        </div>
      </div>
    </>
  );
}
