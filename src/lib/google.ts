import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

/* Login con Google (OAuth 2.0 / OpenID Connect), sin dependencias externas. */

export const GOOGLE_STATE_COOKIE = "g_state";
/** Marca de cuenta sin contraseña: verifyPassword() nunca la acepta. */
const NO_PASSWORD = "google";

export const googleEnabled = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const googleRedirectUri = (origin: string) => `${origin}/auth/google/callback`;

export function googleAuthUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

type GoogleProfile = { email: string; name: string };

/** Canjea el código por el id_token y devuelve email (verificado) y nombre. */
export async function googleProfile(origin: string, code: string): Promise<GoogleProfile | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(origin),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) return null;

  // El token llega directo de Google por HTTPS, así que no hace falta verificar la firma.
  const claims = JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString()) as {
    aud?: string;
    iss?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
  if (
    claims.aud !== process.env.GOOGLE_CLIENT_ID ||
    !["accounts.google.com", "https://accounts.google.com"].includes(claims.iss ?? "") ||
    !claims.email ||
    !claims.email_verified
  ) {
    return null;
  }
  return { email: claims.email.toLowerCase(), name: claims.name ?? "" };
}

/** Busca la cuenta por email (la vincula si ya existe) o crea una nueva. */
export async function findOrCreateGoogleUser({ email, name }: GoogleProfile) {
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get();
  if (existing) return { id: existing.id, created: false };

  let displayName = name.trim().slice(0, 40);
  if (displayName.length < 2) displayName = email.split("@")[0].slice(0, 40);

  // Igual que en el registro: el primer usuario queda como administrador.
  const first = !(await db.select({ id: schema.users.id }).from(schema.users).limit(1).get());
  const [user] = await db
    .insert(schema.users)
    .values({ displayName, email, passwordHash: NO_PASSWORD, role: first ? "admin" : "user" })
    .returning({ id: schema.users.id });
  return { id: user.id, created: true };
}
