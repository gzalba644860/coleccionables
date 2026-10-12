// Mismo formato que src/lib/auth.ts, usable fuera de Next (scripts).
import { randomBytes, scryptSync } from "node:crypto";

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
