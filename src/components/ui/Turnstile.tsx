"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

/** Cloudflare Turnstile widget with verify-state callback.
 *  Renders nothing until the admin sets NEXT_PUBLIC_TURNSTILE_SITE_KEY.
 *  onVerify(true) fires when the visitor passes; onVerify(false) on expiry/error,
 *  so forms stay disabled until a fresh token exists (no more premature submits). */
export function Turnstile({ onVerify }: { onVerify?: (ok: boolean) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const cb = useRef(onVerify);
  cb.current = onVerify;

  useEffect(() => {
    if (!siteKey || !ready || !ref.current || !window.turnstile) return;
    if (ref.current.dataset.done) return;
    ref.current.dataset.done = "1";
    window.turnstile.render(ref.current, {
      sitekey: siteKey,
      theme: "light",
      callback: () => cb.current?.(true),
      "expired-callback": () => cb.current?.(false),
      "error-callback": () => cb.current?.(false),
    });
  }, [ready, siteKey]);

  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" onLoad={() => setReady(true)} />
      <div ref={ref} />
    </>
  );
}
