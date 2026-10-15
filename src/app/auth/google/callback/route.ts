import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createSession } from "@/lib/auth";
import {
  GOOGLE_STATE_COOKIE,
  findOrCreateGoogleUser,
  googleEnabled,
  googleProfile,
} from "@/lib/google";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const store = await cookies();
  const expected = store.get(GOOGLE_STATE_COOKIE)?.value;
  store.delete(GOOGLE_STATE_COOKIE);

  const code = params.get("code");
  if (!googleEnabled() || !code || !expected || params.get("state") !== expected) {
    redirect("/ingresar?error=google");
  }

  const profile = await googleProfile(request.nextUrl.origin, code);
  if (!profile) redirect("/ingresar?error=google");

  const user = await findOrCreateGoogleUser(profile);
  await createSession(user.id);
  redirect(user.created ? "/mi-cuenta/perfil" : "/mi-cuenta");
}
