import { getSessionUser } from "@/lib/auth";
import { BottomNavLinks } from "./bottom-nav-links";

/** Barra de navegación inferior para celular (como una app). */
export async function BottomNav() {
  const user = await getSessionUser();
  if (user && user.status !== "approved") return null;
  return <BottomNavLinks loggedIn={!!user} />;
}
