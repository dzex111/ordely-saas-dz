import { NextResponse } from "next/server";
import { sendPendingDigests } from "@/lib/digest";
import { syncShipments } from "@/lib/shipping-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* Daily Vercel Cron entrypoint (vercel.json → 05:00 UTC = 06:00 Algiers):
 *  1. sync active shipment tracking (Yalidine / ZR / EcoTrack)
 *  2. send the pending-orders digest (max 1/store/day, Brevo-safe)
 *
 * Auth:
 * - CRON_SECRET env set → require `Authorization: Bearer <secret>` (Vercel sends it automatically)
 * - otherwise → require the `x-vercel-cron` header (set only by Vercel's scheduler)
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
  return req.headers.get("x-vercel-cron") !== null;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const shipments = await syncShipments();
  const digests = await sendPendingDigests();
  return NextResponse.json({ ok: true, shipments, digests });
}