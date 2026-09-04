"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { GripVertical, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import type { Product, ProductFeature, ProductOption } from "@/db/schema";
import { createProductAction, deleteProductAction, updateProductAction, uploadImageAction } from "@/lib/actions/products";
import { slugify } from "@/lib/utils";
import { Notice } from "./ui";

type Props = { product?: Product; storePath: string; canDelete?: boolean };

export function ProductForm({ product, storePath, canDelete = true }: Props) {
  const isEdit = Boolean(product);
  const boundUpdate = product ? updateProductAction.bind(null, product.id) : null;
  const [state, action, pending] = useActionState(boundUpdate ?? createProductAction, null);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [features, setFeatures] = useState<ProductFeature[]>(product?.features ?? []);
  const [options, setOptions] = useState<ProductOption[]>(product?.options ?? []);
  const [uploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [name, setName] = useState(product?.name ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleting, startDelete] = useTransition();

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError(null);
    const list = Array.from(files).slice(0, 10 - images.length);
    startUpload(async () => {
      for (const f of list) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await uploadImageAction(fd);
        if (res.url) setImages((prev) => [...prev, res.url!]);
        else setUploadError(res.error ?? "Upload échoué.");
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  const move = (i: number, dir: -1 | 1) =>
    setImages((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="features" value={JSON.stringify(features)} />
      <input type="hidden" name="options" value={JSON.stringify(options)} />

      <div className="space-y-6 lg:col-span-2">
        <section className="db-card p-5">
          <div className="grid gap-4">
            <div>
              <label className="db-label" htmlFor="name">Nom du produit</label>
              <input id="name" name="name" required value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} className="db-input !text-base" placeholder="Ex : Trench Sahel en lin" />
            </div>
            <div>
              <label className="db-label" htmlFor="slug">URL</label>
              <div className="flex items-center rounded-lg border border-zinc-200 bg-white text-sm shadow-sm">
                <span className="whitespace-nowrap border-r border-zinc-200 px-3 py-2 text-xs text-zinc-500">{storePath}/p/</span>
                <input id="slug" name="slug" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} className="w-full bg-transparent px-3 py-2 outline-none" />
              </div>
            </div>
            <div>
              <label className="db-label" htmlFor="shortDescription">Accroche (1 phrase, affichée sous le titre)</label>
              <input id="shortDescription" name="shortDescription" maxLength={200} defaultValue={product?.shortDescription} className="db-input" placeholder="Ce qui rend ce produit désirable en une phrase." />
            </div>
            <div>
              <label className="db-label" htmlFor="description">Histoire du produit</label>
              <textarea id="description" name="description" rows={7} defaultValue={product?.description} className="db-input" placeholder="Matières, fabrication, pour qui, comment l’utiliser. Séparez les paragraphes par une ligne vide." />
            </div>
          </div>
        </section>

        <section className="db-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Photos <span className="font-normal text-zinc-500">({images.length}/10)</span></p>
            <p className="text-xs text-zinc-500">La première est la photo principale.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {images.map((src, i) => (
              <div key={src + i} className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">Principale</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 p-1.5 opacity-0 transition group-hover:opacity-100">
                  <button type="button" onClick={() => move(i, -1)} className="rounded bg-white/90 p-1 text-zinc-800" aria-label="Avancer"><GripVertical className="h-3 w-3" /></button>
                  <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="rounded bg-white/90 p-1 text-rose-600" aria-label="Supprimer"><X className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
            {images.length < 10 && (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-300 text-xs text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-800">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                {uploading ? "Envoi…" : "Ajouter"}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          <div className="mt-3 flex gap-2">
            <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="…ou coller l’URL d’une image" className="db-input" />
            <button type="button" className="db-btn-secondary shrink-0" onClick={() => { if (/^https?:\/\//.test(urlInput) && images.length < 10) { setImages((p) => [...p, urlInput.trim()]); setUrlInput(""); } }}>Ajouter</button>
          </div>
          {uploadError && <p className="mt-2 text-xs text-rose-600">{uploadError}</p>}
        </section>

        <section className="db-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Points clés <span className="font-normal text-zinc-500">(matière, dimensions, garantie…)</span></p>
            <button type="button" disabled={features.length >= 8} onClick={() => setFeatures((f) => [...f, { title: "", text: "" }])} className="db-btn-secondary !px-2.5 !py-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Ajouter</button>
          </div>
          {features.length === 0 && <p className="text-xs text-zinc-500">Aucun point clé. Ils s’affichent en cartes sur la fiche produit et rassurent avant l’achat.</p>}
          <div className="space-y-2">
            {features.map((f, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                <input value={f.title} onChange={(e) => setFeatures((p) => p.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Matière" className="db-input" />
                <input value={f.text} onChange={(e) => setFeatures((p) => p.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder="100% lin lavé" className="db-input" />
                <button type="button" onClick={() => setFeatures((p) => p.filter((_, j) => j !== i))} className="rounded-lg px-2 text-zinc-400 hover:text-rose-600" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="db-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Options <span className="font-normal text-zinc-500">(taille, couleur… max 3)</span></p>
            <button type="button" disabled={options.length >= 3} onClick={() => setOptions((o) => [...o, { name: "", values: [] }])} className="db-btn-secondary !px-2.5 !py-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Ajouter une option</button>
          </div>
          {options.length === 0 && <p className="text-xs text-zinc-500">Sans options, le client commande directement. Avec options, il doit choisir avant de valider.</p>}
          <div className="space-y-3">
            {options.map((o, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 p-3">
                <div className="flex gap-2">
                  <input value={o.name} onChange={(e) => setOptions((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Nom (ex : Taille)" className="db-input" />
                  <input value={o.values.join(", ")} onChange={(e) => setOptions((p) => p.map((x, j) => (j === i ? { ...x, values: e.target.value.split(",").map((v) => v.trimStart()) } : x)))} placeholder="Valeurs séparées par des virgules (S, M, L)" className="db-input flex-[2]" />
                  <button type="button" onClick={() => setOptions((p) => p.filter((_, j) => j !== i))} className="rounded-lg px-2 text-zinc-400 hover:text-rose-600" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="db-card p-5">
          <p className="mb-4 text-sm font-semibold">Prix & stock</p>
          <div className="grid gap-4">
            <div>
              <label className="db-label" htmlFor="price">Prix de vente (DA)</label>
              <input id="price" name="price" type="number" min={0} step={1} required defaultValue={product?.price ?? ""} className="db-input !text-base font-semibold" placeholder="4900" />
            </div>
            <div>
              <label className="db-label" htmlFor="compareAtPrice">Prix barré (facultatif)</label>
              <input id="compareAtPrice" name="compareAtPrice" type="number" min={0} step={1} defaultValue={product?.compareAtPrice ?? ""} className="db-input" placeholder="5900" />
            </div>
            <div>
              <label className="db-label" htmlFor="stock">Stock (vide = illimité)</label>
              <input id="stock" name="stock" type="number" min={0} step={1} defaultValue={product?.stock ?? ""} className="db-input" placeholder="∞" />
            </div>
          </div>
        </section>
        <section className="db-card p-5">
          <p className="mb-4 text-sm font-semibold">Visibilité</p>
          <div className="grid gap-4">
            <div>
              <label className="db-label" htmlFor="status">Statut</label>
              <select id="status" name="status" defaultValue={product?.status ?? "active"} className="db-input">
                <option value="active">En ligne</option>
                <option value="draft">Brouillon (caché)</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={product?.featured} className="h-4 w-4 accent-zinc-900" /> Mettre en avant (premier + image du hero)
            </label>
          </div>
        </section>
        <div className="space-y-3">
          <Notice state={state} />
          <button type="submit" disabled={pending || uploading} className="db-btn w-full !py-2.5">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} {isEdit ? "Enregistrer les modifications" : "Publier le produit"}
          </button>
          {isEdit && product && canDelete && (
            <button type="button" disabled={deleting} onClick={() => { if (confirm("Supprimer définitivement ce produit ?")) startDelete(async () => { const r = await deleteProductAction(product.id); if (r && "error" in r) alert(r.error); }); }} className="db-btn-danger w-full">
              {deleting ? "Suppression…" : "Supprimer le produit"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
