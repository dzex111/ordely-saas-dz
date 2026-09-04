import { randomBytes } from "node:crypto";

/** Merchant-facing store ID: ORD-XXXXXX (unambiguous alphabet, no 0/O/1/I).
 *  Uniqueness is enforced by the DB unique constraint; callers retry on collision. */
export function generateStorePublicId(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let code = "";
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return `ORD-${code}`;
}
