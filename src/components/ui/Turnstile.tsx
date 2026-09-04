import Script from "next/script";

/** Cloudflare Turnstile widget. Renders nothing until the admin sets
 *  NEXT_PUBLIC_TURNSTILE_SITE_KEY (Cloudflare dashboard → Turnstile, free). */
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
    </>
  );
}
