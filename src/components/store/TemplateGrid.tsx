"use client";

import { useState } from "react";
import Link from "next/link";
import { TEMPLATES } from "@/lib/templates";
import { storeUrl } from "@/lib/utils";
import { TemplatePreview } from "@/components/dashboard/TemplatePreview";

type Demo = { subdomain: string; template: string; name: string };

const VISIBLE_COUNT = 6;

export function TemplateGrid({ demos }: { demos: Demo[] }) {
  const [expanded, setExpanded] = useState(false);
  const demoFor = (templateId: string) => demos.find((d) => d.template === templateId);
  const visible = expanded ? TEMPLATES : TEMPLATES.slice(0, VISIBLE_COUNT);
  const hiddenCount = TEMPLATES.length - VISIBLE_COUNT;

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((t) => {
          const demo = demoFor(t.id);
          const card = (
            <>
              <TemplatePreview t={t} className="transition duration-700 group-hover:scale-[1.02]" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">{t.name}</p>
                  <span className="text-xs text-zinc-500">{t.vertical}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{t.tagline}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  {[t.colors.bg, t.colors.fg, t.colors.primary, t.colors.accent].map((c, i) => <span key={i} className="h-4 w-4 rounded-full border border-black/10" style={{ background: c }} />)}
                  <span className="ml-auto text-xs font-medium text-zinc-700 group-hover:text-ink">{demo ? "Voir la démo →" : "Choisir →"}</span>
                </div>
              </div>
            </>
          );
          return demo ? (
            <a key={t.id} href={storeUrl(demo.subdomain)} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">{card}</a>
          ) : (
            <Link key={t.id} href="/signup" className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">{card}</Link>
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold transition hover:bg-zinc-50"
          >
            {expanded ? "Voir moins" : `Voir plus (${hiddenCount} de plus)`}
          </button>
        </div>
      )}
    </div>
  );
}
