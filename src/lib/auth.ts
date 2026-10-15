import "server-only";
import {
  createHash,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 30;

/* ── Contraseñas (scrypt, sin dependencias externas) ── */

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/* ── Sesiones en base de datos, token opaco en cookie httpOnly ── */

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db
    .insert(schema.sessions)
    .values({ id: sha256(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
  }
  store.delete(SESSION_COOKIE);
}

export type CurrentUser = {
  id: number;
  displayName: string;
  role: "user" | "admin";
  status: "pending" | "approved" | "rejected";
  avatarVersion: number;
};

/** Usuario con sesión, aprobado o no (deduplicado por request). Lee cookies: usar detrás de <Suspense>. */
export const getSessionUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await db
    .select({
      id: schema.users.id,
      displayName: schema.users.displayName,
      role: schema.users.role,
      status: schema.users.status,
      avatarVersion: schema.users.avatarVersion,
      expiresAt: schema.sessions.expiresAt,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(eq(schema.sessions.id, sha256(token)))
    .get();
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return {
    id: row.id,
    displayName: row.displayName,
    role: row.role,
    status: row.status,
    avatarVersion: row.avatarVersion,
  };
});

/** Usuario logueado y aprobado por un admin, o null. Las cuentas pendientes no usan el portal. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const user = await getSessionUser();
  return user?.status === "approved" ? user : null;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getSessionUser();
  if (!user) redirect("/ingresar");
  if (user.status !== "approved") redirect("/pendiente");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
