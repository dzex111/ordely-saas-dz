import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { media } from "@/db/schema";
import { createAdminSupabase, isSupabaseStorageConfigured, SUPABASE_BUCKET } from "@/lib/supabase";

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

/**
 * Uploads an image and returns a public URL.
 * - Supabase configured → Supabase Storage bucket (public) under `stores/{storeId}/…`
 * - Otherwise → stored in Postgres and served by /api/media/[id]
 */
export async function uploadImage(file: File, storeId: string): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return { error: "Format non supporté (JPG, PNG, WEBP, AVIF)." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image trop lourde (max 6 Mo)." };

  const buffer = Buffer.from(await file.arrayBuffer());

  if (isSupabaseStorageConfigured()) {
    const supabase = createAdminSupabase();
    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
    const path = `stores/${storeId}/${randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) return { error: `Upload Supabase échoué : ${error.message}` };
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  }

  const [row] = await db
    .insert(media)
    .values({ storeId, mime: file.type, size: buffer.length, data: buffer })
    .returning({ id: media.id });
  return { url: `/api/media/${row.id}` };
}
