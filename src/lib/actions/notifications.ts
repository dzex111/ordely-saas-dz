"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireStore } from "@/lib/auth";

/** Insert a merchant notification. Best-effort — failures never break the caller. */
export async function pushNotification(input: {
  storeId: string;
  type: "new_order" | "plan_changed" | "suspended" | "unsuspended" | "limit_warning";
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    await db.insert(notifications).values({
      storeId: input.storeId,
      type: input.type,
      title: input.title,
      body: input.body ?? "",
      link: input.link ?? "",
    });
  } catch {
    // notifications must never break orders or admin actions
  }
}

export async function markAllNotificationsRead() {
  const { store } = await requireStore();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.storeId, store.id), isNull(notifications.readAt)));
  revalidatePath("/dashboard", "layout");
  return { success: "ok" };
}
