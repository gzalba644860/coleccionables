import { NextResponse, type NextRequest } from "next/server";

/**
 * Chequeo optimista: si no hay cookie de sesión, las páginas privadas
 * redirigen a /ingresar sin tocar la base. La validación real de la
 * sesión ocurre en requireUser() (src/lib/auth.ts).
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("sid")) {
    return NextResponse.redirect(new URL("/ingresar", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/mi-cuenta/:path*", "/admin/:path*", "/mensajes/:path*"],
};
