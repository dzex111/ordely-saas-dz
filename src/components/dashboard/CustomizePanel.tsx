"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RefreshCw, Upload, Undo2, ExternalLink } from "lucide-react";
import type { Store } from "@/db/schema";
import { changeTemplateAction, resetBrandAction, updateBrandAction, updateContentAction } from "@/lib/actions/store";
import { uploadImageAction } from "@/lib/actions/products";
import { FONT_OPTIONS, TEMPLATES, getTemplate, type FontKey } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { TemplatePreview } from "./TemplatePreview";
import { Notice } from "./ui";

type Tab = "template" | "brand" | "content";

export function CustomizePanel({ store, previewUrl }: { store: Store; previewUrl: string }) {
  const [tab, setTab] = useState<Tab>("template");
  const [previewKey, setPreviewKey] = useState(0);
  const router = useRouter();
  const reload = () => {
    setPreviewKey((k) => k + 1);
    router.refresh();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <div className="space-y-5 xl:col-span-3">
        <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
          {([["template", "Template"], ["brand", "Identité"], ["content", "Contenu"]] as [Tab, string][]).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={cn("rounded-lg px-4 py-1.5 text-sm font-medium transition", tab === k ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900")}>{l}</button>
          ))}
        </div>
        {tab === "template" && <TemplateTab store={store} onDone={reload} />}
        {tab === "brand" && <BrandTab store={store} onDone={reload} />}
        {tab === "content" && <ContentTab store={store} onDone={reload} />}
      </div>

      <div className="xl:col-span-2">
        <div className="sticky top-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Aperçu en direct</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPreviewKey((k) => k + 1)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900"><RefreshCw className="h-3 w-3" /> Recharger</button>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900"><ExternalLink className="h-3 w-3" /> Ouvrir</a>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
            <div className="flex items-center gap-1.5 border-b border-zinc-100 bg-zinc-50 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" /><span className="h-2.5 w-2.5 rounded-full bg-zinc-300" /><span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
              <span className="ml-2 truncate text-[11px] text-zinc-500">{previewUrl}</span>
            </div>
            <iframe key={previewKey} src={previewUrl} title="Aperçu boutique" className="h-[70vh] w-full bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateTab({ store, onDone }: { store: Store; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [target, setTarget] = useState<string | null>(null);
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  return (
    <div className="space-y-4">
      <Notice state={result} />
      <div className="grid gap-4 sm:grid-cols-2">
        {TEMPLATES.map((t) => {
          const active = t.id === store.template;
          return (
            <div key={t.id} className={cn("overflow-hidden rounded-2xl border bg-white shadow-sm transition", active ? "border-zinc-900 ring-2 ring-zinc-900/10" : "border-zinc-200")}>
              <TemplatePreview t={t} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.vertical}</p>
                  </div>
                  {active ? (
                    <span className="flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-white"><Check className="h-3 w-3" /> Actif</span>
                  ) : (
                    <button type="button" disabled={pending} onClick={() => { setTarget(t.id); start(async () => { setResult(await changeTemplateAction(t.id)); onDone(); }); }} className="db-btn-secondary !px-3 !py-1.5 text-xs">
                      {pending && target === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Appliquer
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">{t.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.mood.map((m) => <span key={m} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">{m}</span>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-zinc-500">Changer de template réinitialise les couleurs personnalisées (vos textes et produits sont conservés).</p>
    </div>
  );
}

function ColorField({ name, label, value, fallback }: { name: string; label: string; value?: string; fallback: string }) {
  const [v, setV] = useState(value ?? "");
  const shown = v || fallback;
  return (
    <div>
      <label className="db-label">{label}</label>
      <div className="flex items-center gap-2">
        <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-zinc-200" style={{ background: shown }}>
          <input type="color" value={shown} onChange={(e) => setV(e.target.value.toUpperCase())} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
        <input name={name} value={v} onChange={(e) => setV(e.target.value)} placeholder={fallback} className="db-input font-mono uppercase" maxLength={7} />
        {v && <button type="button" onClick={() => setV("")} className="text-xs text-zinc-400 hover:text-zinc-900">Défaut</button>}
      </div>
    </div>
  );
}

function BrandTab({ store, onDone }: { store: Store; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateBrandAction, null);
  const [logo, setLogo] = useState(store.logoUrl ?? "");
  const [uploading, startUpload] = useTransition();
  const [resetting, startReset] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const tpl = getTemplate(store.template);
  const radius = parseInt(store.brand.radius ?? tpl.radius, 10);
  const [r, setR] = useState(Number.isFinite(radius) ? radius : 8);
  const doneRef = useRef(state);
  useEffect(() => {
    if (state && state !== doneRef.current && state.success) onDone();
    doneRef.current = state;
  }, [state, onDone]);

  const fonts = Object.entries(FONT_OPTIONS) as [FontKey, (typeof FONT_OPTIONS)[FontKey]][];
  return (
    <form action={action} className="db-card space-y-6 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="db-label" htmlFor="name">Nom de la marque</label>
          <input id="name" name="name" required defaultValue={store.name} className="db-input" />
        </div>
        <div>
          <label className="db-label" htmlFor="tagline">Signature (footer & SEO)</label>
          <input id="tagline" name="tagline" defaultValue={store.tagline} className="db-input" placeholder="Une phrase qui vous résume" />
        </div>
      </div>
      <div>
        <label className="db-label">Logo (remplace le nom dans l’en-tête)</label>
        <input type="hidden" name="logoUrl" value={logo} />
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-32 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="max-h-10 max-w-[100px] object-contain" />
            ) : (
              <span className="text-xs text-zinc-400">Aucun</span>
            )}
          </div>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="db-btn-secondary">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Importer</button>
          {logo && <button type="button" onClick={() => setLogo("")} className="text-xs text-zinc-500 hover:text-zinc-900">Retirer</button>}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; startUpload(async () => { const fd = new FormData(); fd.append("file", f); const res = await uploadImageAction(fd); if (res.url) setLogo(res.url); }); }} />
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold">Couleurs <span className="font-normal text-zinc-500">— vides = valeurs du template {tpl.name}</span></p>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField name="primary" label="Principale (boutons)" value={store.brand.primary} fallback={tpl.colors.primary} />
          <ColorField name="accent" label="Accent (badges, détails)" value={store.brand.accent} fallback={tpl.colors.accent} />
          <ColorField name="bg" label="Fond" value={store.brand.bg} fallback={tpl.colors.bg} />
          <ColorField name="fg" label="Texte" value={store.brand.fg} fallback={tpl.colors.fg} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="db-label" htmlFor="headingFont">Police des titres</label>
          <select id="headingFont" name="headingFont" defaultValue={store.brand.headingFont ?? tpl.fonts.heading} className="db-input">
            {fonts.map(([k, f]) => <option key={k} value={k}>{f.label} · {f.kind}</option>)}
          </select>
        </div>
        <div>
          <label className="db-label" htmlFor="bodyFont">Police du texte</label>
          <select id="bodyFont" name="bodyFont" defaultValue={store.brand.bodyFont ?? tpl.fonts.body} className="db-input">
            {fonts.filter(([, f]) => f.kind !== "display").map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="db-label" htmlFor="radius">Arrondis · {r}px</label>
          <input id="radius" name="radius" type="range" min={0} max={32} value={r} onChange={(e) => setR(Number(e.target.value))} className="mt-2 w-full accent-zinc-900" />
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Notice state={state} />
        <div className="ml-auto flex gap-2">
          <button type="button" disabled={resetting} onClick={() => startReset(async () => { await resetBrandAction(); onDone(); })} className="db-btn-secondary"><Undo2 className="h-4 w-4" /> Réinitialiser</button>
          <button type="submit" disabled={pending} className="db-btn">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Publier</button>
        </div>
      </div>
    </form>
  );
}

function F({ name, label, value, ph, rows }: { name: string; label: string; value?: string; ph?: string; rows?: number }) {
  return (
    <div>
      <label className="db-label" htmlFor={name}>{label}</label>
      {rows ? <textarea id={name} name={name} rows={rows} defaultValue={value} placeholder={ph} className="db-input" /> : <input id={name} name={name} defaultValue={value} placeholder={ph} className="db-input" />}
    </div>
  );
}

function ContentTab({ store, onDone }: { store: Store; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateContentAction, null);
  const tpl = getTemplate(store.template);
  const c = store.content;
  const d = tpl.defaults;
  const doneRef = useRef(state);
  useEffect(() => {
    if (state && state !== doneRef.current && state.success) onDone();
    doneRef.current = state;
  }, [state, onDone]);
  return (
    <form action={action} className="space-y-5">
      <section className="db-card space-y-4 p-5">
        <p className="text-sm font-semibold">Bandeau & accueil <span className="font-normal text-zinc-500">— vide = texte du template</span></p>
        <F name="announcement" label="Bandeau défilant (promo, livraison…)" value={c.announcement} ph="Livraison offerte dès 5 000 DA · Paiement à la réception" />
        <F name="heroEyebrow" label="Sur-titre" value={c.heroEyebrow} ph={d.heroEyebrow} />
        <F name="heroHeadline" label="Titre principal" value={c.heroHeadline} ph={d.heroHeadline} />
        <F name="heroSub" label="Sous-titre" value={c.heroSub} ph={d.heroSub} rows={2} />
        <div className="grid gap-4 sm:grid-cols-2">
          <F name="heroCta" label="Texte du bouton" value={c.heroCta} ph={d.heroCta} />
          <F name="heroImage" label="Image du hero (URL) — sinon 1er produit" value={c.heroImage} ph="https://…" />
        </div>
        <F name="trustItems" label="Arguments de confiance (un par ligne, max 6)" value={(c.trustItems ?? []).join("\n")} ph={d.trustItems.join("\n")} rows={4} />
      </section>
      <section className="db-card space-y-4 p-5">
        <p className="text-sm font-semibold">À propos</p>
        <F name="aboutTitle" label="Titre" value={c.aboutTitle} ph={d.aboutTitle} />
        <F name="aboutText" label="Texte" value={c.aboutText} ph={d.aboutText} rows={4} />
      </section>
      <section className="db-card space-y-4 p-5">
        <p className="text-sm font-semibold">Contact & réseaux</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <F name="phone" label="Téléphone" value={c.phone} ph="0550 00 00 00" />
          <F name="whatsapp" label="WhatsApp" value={c.whatsapp} ph="0550 00 00 00" />
          <F name="instagram" label="Instagram" value={c.instagram} ph="@votremarque" />
          <F name="facebook" label="Facebook (URL ou page)" value={c.facebook} ph="votremarque" />
          <F name="tiktok" label="TikTok" value={c.tiktok} ph="@votremarque" />
          <F name="email" label="Email" value={c.email} ph="contact@marque.dz" />
        </div>
        <F name="footerNote" label="Mention pied de page" value={c.footerNote} ph="Tous droits réservés." />
      </section>
      <div className="flex items-center justify-between gap-3">
        <Notice state={state} />
        <button type="submit" disabled={pending} className="db-btn ml-auto">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Publier le contenu</button>
      </div>
    </form>
  );
}
