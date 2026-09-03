import { FONT_OPTIONS, type TemplateConfig } from "@/lib/templates";

/** Miniature, faithful mockup of a template built from its real tokens. */
export function TemplatePreview({ t, className = "" }: { t: TemplateConfig; className?: string }) {
  const c = t.colors;
  const heading = FONT_OPTIONS[t.fonts.heading].css;
  const r = t.radius;
  const upper = t.layout.headingCase === "upper";
  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ background: c.bg, color: c.fg, aspectRatio: "4 / 3" }} aria-hidden>
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${c.border}` }}>
        <span style={{ fontFamily: heading, fontSize: 9, fontWeight: 600 }}>{t.name}</span>
        <span style={{ background: c.primary, color: c.primaryFg, borderRadius: r, fontSize: 5, padding: "2px 6px" }}>Commander</span>
      </div>
      {/* hero */}
      <div className="grid grid-cols-5 gap-2 px-3 pt-3">
        <div className="col-span-3">
          <div style={{ width: 28, height: 3, background: c.accent, marginBottom: 6 }} />
          <div style={{ fontFamily: heading, fontSize: upper ? 10 : 11, lineHeight: 1.05, fontWeight: t.layout.headingWeight, textTransform: upper ? "uppercase" : "none" }}>{t.defaults.heroHeadline.split(",")[0].split(".")[0]}</div>
          <div style={{ marginTop: 6, height: 3, width: "80%", background: c.muted, opacity: 0.35 }} />
          <div style={{ marginTop: 3, height: 3, width: "60%", background: c.muted, opacity: 0.35 }} />
          <div style={{ marginTop: 8, display: "inline-block", background: c.primary, borderRadius: r, width: 34, height: 9 }} />
        </div>
        <div className="col-span-2" style={{ background: `linear-gradient(135deg, ${c.card}, ${c.accent}66)`, borderRadius: t.layout.hero === "soft" ? "50% 50% 45% 55% / 45% 55% 45% 55%" : r, aspectRatio: "4/5" }} />
      </div>
      {/* products */}
      <div className="grid grid-cols-3 gap-1.5 px-3 pt-3">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: r, aspectRatio: t.layout.imageRatio }} />
            <div style={{ marginTop: 3, height: 2.5, width: "70%", background: c.fg, opacity: 0.7 }} />
            <div style={{ marginTop: 2, height: 2.5, width: "35%", background: c.accent }} />
          </div>
        ))}
      </div>
    </div>
  );
}
