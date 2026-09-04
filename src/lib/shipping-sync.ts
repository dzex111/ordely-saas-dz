import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderEvents, orders, shippingCredentials, shipments } from "@/db/schema";
import { ORDER_TRANSITIONS, orderTargetFromShipment } from "@/lib/commerce";
import { getProvider, providerLabel } from "@/lib/shipping";

/* Daily shipment tracking sync — run by Vercel Cron (/api/cron, vercel.json).
 *
 * Honest and bounded by design:
 * - only ACTIVE shipments are polled (terminal ones: delivered/returned/cancelled are left alone)
 * - hard limit TRACK_LIMIT per run — a few couriers × 100 parcels max, once a day
 * - a courier "unknown" wording NEVER overwrites a known status (only lastCheckedAt is refreshed)
 * - order status follows the shipment only through legal ORDER_TRANSITIONS — pending→confirmed
 *   stays merchant-gated; the merchant always keeps manual control.
 */

const ACTIVE_SHIPMENT_STATUSES = ["created", "picked", "transit", "failed", "unknown"] as const;
const TRACK_LIMIT = 100;

export type SyncResult = { checked: number; updated: number; failed: number; skipped: number; ordersMoved: number };

export async function syncShipments(): Promise<SyncResult> {
  const rows = await db
    .select({
      id: shipments.id,
      storeId: shipments.storeId,
      orderId: shipments.orderId,
      provider: shipments.provider,
      trackingNumber: shipments.trackingNumber,
      status: shipments.status,
      orderStatus: orders.status,
    })
    .from(shipments)
    .innerJoin(orders, eq(shipments.orderId, orders.id))
    .where(inArray(shipments.status, [...ACTIVE_SHIPMENT_STATUSES]))
    .limit(TRACK_LIMIT);

  let updated = 0;
  let failed = 0;
  let skipped = 0;
  let ordersMoved = 0;

  for (const row of rows) {
    try {
      const cred = await db.query.shippingCredentials.findFirst({
        where: and(
          eq(shippingCredentials.storeId, row.storeId),
          eq(shippingCredentials.provider, row.provider),
          eq(shippingCredentials.isActive, true),
        ),
      });
      const provider = getProvider(row.provider);
      if (!cred || !provider) {
        skipped += 1;
        continue;
      }

      const info = await provider.trackShipment(cred.credentials, row.trackingNumber);
      const next = info.status === "unknown" ? null : info.status;

      if (next && next !== row.status) {
        await db
          .update(shipments)
          .set({ status: next, lastCheckedAt: new Date(), updatedAt: new Date(), raw: (info.raw ?? {}) as Record<string, unknown> })
          .where(eq(shipments.id, row.id));
        updated += 1;
      } else {
        await db.update(shipments).set({ lastCheckedAt: new Date() }).where(eq(shipments.id, row.id));
      }

      // Order follows the shipment — only through a legal transition.
      const target = next ? orderTargetFromShipment(next) : null;
      if (target && target !== row.orderStatus && ORDER_TRANSITIONS[row.orderStatus]?.includes(target)) {
        await db.transaction(async (tx) => {
          await tx.update(orders).set({ status: target, updatedAt: new Date() }).where(eq(orders.id, row.orderId));
          await tx.insert(orderEvents).values({
            orderId: row.orderId,
            fromStatus: row.orderStatus,
            toStatus: target,
            note: `Mise à jour automatique du suivi ${providerLabel(row.provider)}.`,
          });
        });
        ordersMoved += 1;
      }
    } catch {
      // One broken credential / courier outage must never stop the whole sync.
      failed += 1;
    }
  }

  return { checked: rows.length, updated, failed, skipped, ordersMoved };
}