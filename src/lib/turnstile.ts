/**
 * Cloudflare Turnstile verification (free CAPTCHA).
 * If keys are not configured yet, verification is skipped (honeypot + rate
 * limits still apply) so the forms keep working before the admin adds keys.
 */
export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
    return !!data?.success;
  } catch {
    return false;
  }
}
