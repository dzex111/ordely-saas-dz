"use server";

import { z } from "zod";
import { db } from "@/db";
import { contactRequests, PLAN_IDS, type PlanId } from "@/db/schema";
import { getCurrentStore } from "@/lib/auth";
import type { FormState } from "./auth";

/** Public contact form — plan upgrade requests. Stored for manual review by the admin.
 *  Nothing here ever changes a store plan; only the admin does that directly. */
export async function createContactRequestAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Votre nom est requis.").max(80),
      contact: z.string().trim().min(5, "Ajoutez un email ou un numéro de téléphone.").max(120),
      plan: z.string(),
      message: z.string().trim().max(1000).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const plan = (PLAN_IDS as readonly string[]).includes(parsed.data.plan)
    ? (parsed.data.plan as PlanId)
    : ("growth" as PlanId);

  const store = await getCurrentStore().catch(() => null);
  await db.insert(contactRequests).values({
    storeId: store?.id ?? null,
    name: parsed.data.name,
    contact: parsed.data.contact,
    plan,
    message: parsed.data.message ?? "",
  });
  return { success: "Demande envoyée. L’admin vous contactera pour activer votre plan." };
}
