"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="sf-img flex aspect-[4/5] items-center justify-center text-sm sf-muted" style={{ background: "var(--card)" }}>
        Photos à venir
      </div>
    );
  }
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className="space-y-3">
      <div className="sf-img relative aspect-[4/5]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={current} src={current} alt={name} className="h-full w-full object-cover animate-fade-up" style={{ animationDuration: "0.4s" }} />
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
            {images.map((_, i) => (
              <button key={i} type="button" aria-label={`Image ${i + 1}`} onClick={() => setActive(i)} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-white" : "w-1.5 bg-white/60")} />
            ))}
          </div>
        )}
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Précédente" onClick={() => setActive((a) => (a - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60">
              ‹
            </button>
            <button type="button" aria-label="Suivante" onClick={() => setActive((a) => (a + 1) % images.length)} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60">
              ›
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="hidden grid-cols-5 gap-2 md:grid">
          {images.map((src, i) => (
            <button key={src + i} type="button" onClick={() => setActive(i)} className={cn("sf-img aspect-square overflow-hidden border-2 transition", i === active ? "border-[var(--primary)]" : "border-transparent opacity-70 hover:opacity-100")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
