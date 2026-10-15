import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { GOOGLE_STATE_COOKIE, googleAuthUrl, googleEnabled } from "@/lib/google";

export async function GET(request: NextRequest) {
  if (!googleEnabled()) redirect("/ingresar?error=google");
  const state = randomBytes(16).toString("base64url");
  (await cookies()).set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  redirect(googleAuthUrl(request.nextUrl.origin, state));
}
