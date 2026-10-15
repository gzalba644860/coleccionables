import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { countUnread } from "@/lib/messages";
import { countUnreadNotifications } from "@/lib/notifications";
import { AccountMenu } from "./account-menu";
import { Avatar } from "./avatar";
import { UnreadBadge } from "./unread-badge";

export async function UserNav() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <Link href="/ingresar" className="btn-primary !py-2">
        Ingresar
      </Link>
    );
  }
  if (user.status !== "approved") {
    return (
      <Link href="/pendiente" className="btn-ghost whitespace-nowrap !px-3 !py-2">
        Cuenta en revisión
      </Link>
    );
  }
  const [unread, avisos] = await Promise.all([
    countUnread(user.id),
    countUnreadNotifications(user.id),
  ]);
  return (
    <>
      {user.role === "admin" && (
        <Link href="/admin" className="rounded-lg px-2 py-2 hover:bg-background sm:px-3">
          Admin
        </Link>
      )}
      <Link
        href="/mensajes"
        aria-label="Mensajes"
        className="relative rounded-lg px-2 py-2 hover:bg-background sm:px-3"
      >
        <span className="hidden sm:inline">Mensajes</span>
        <svg viewBox="0 0 24 24" className="size-5 sm:hidden" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
        </svg>
        <UnreadBadge kind="mensajes" initial={unread} />
      </Link>
      <Link
        href="/avisos"
        aria-label="Avisos"
        title="Avisos"
        className="relative rounded-lg px-2 py-2 hover:bg-background"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" strokeLinejoin="round" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" />
        </svg>
        <UnreadBadge kind="avisos" initial={avisos} />
      </Link>
      <Link href="/mi-cuenta" className="btn-primary whitespace-nowrap !px-3 !py-2 max-sm:hidden">
        Mi colección
      </Link>
      <AccountMenu trigger={<Avatar user={user} size={34} />}>
        <p className="truncate px-3 py-1 font-semibold">{user.displayName}</p>
        <Link href="/mi-cuenta" className="rounded-lg px-3 py-2 hover:bg-background">
          Mi colección
        </Link>
        <Link href="/mi-cuenta/perfil" className="rounded-lg px-3 py-2 hover:bg-background">
          Mis datos y foto
        </Link>
        <Link href="/avisos" className="rounded-lg px-3 py-2 hover:bg-background">
          Avisos y notificaciones
        </Link>
        <Link href={`/usuario/${user.id}`} className="rounded-lg px-3 py-2 hover:bg-background">
          Ver mi perfil público
        </Link>
        <form action={logout}>
          <button className="w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-background">
            Cerrar sesión
          </button>
        </form>
      </AccountMenu>
    </>
  );
}
