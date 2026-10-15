import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { countUnread } from "@/lib/messages";
import { AccountMenu } from "./account-menu";
import { Avatar } from "./avatar";
import { UnreadBadge } from "./unread-badge";

export async function UserNav() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <>
        <Link href="/registro" className="rounded-lg px-3 py-2 text-muted hover:bg-subtle hover:text-foreground max-sm:hidden">
          Crear cuenta
        </Link>
        <Link href="/ingresar" className="btn-primary !py-2">
          Ingresar
        </Link>
      </>
    );
  }
  if (user.status !== "approved") {
    return (
      <Link href="/pendiente" className="btn-ghost whitespace-nowrap !px-3 !py-2">
        Cuenta en revisión
      </Link>
    );
  }
  const unread = await countUnread(user.id);
  return (
    <>
      {user.role === "admin" && (
        <Link href="/admin" className="rounded-lg px-3 py-2 text-muted hover:bg-subtle hover:text-foreground max-sm:hidden">
          Admin
        </Link>
      )}
      <Link
        href="/mensajes"
        aria-label="Mensajes"
        className="relative rounded-lg px-3 py-2 text-muted hover:bg-subtle hover:text-foreground max-sm:hidden"
      >
        Mensajes
        <UnreadBadge initial={unread} />
      </Link>
      <Link href="/mi-cuenta" className="btn-primary ml-1 whitespace-nowrap !px-3.5 !py-2 max-sm:hidden">
        Mi colección
      </Link>
      <AccountMenu trigger={<Avatar user={user} size={34} />}>
        <div className="flex items-center gap-3 border-b border-border px-3 pb-3 pt-1">
          <Avatar user={user} size={40} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.displayName}</p>
            <Link href={`/usuario/${user.id}`} className="text-xs text-muted hover:text-accent">
              Ver mi perfil público
            </Link>
          </div>
        </div>
        <Link href="/mi-cuenta" className="menu-item mt-1">
          Mi colección
        </Link>
        <Link href="/mi-cuenta/coincidencias" className="menu-item">
          Coincidencias
        </Link>
        <Link href="/mi-cuenta/perfil" className="menu-item">
          Mis datos y foto
        </Link>
        {user.role === "admin" && (
          <Link href="/admin" className="menu-item">
            Administración
          </Link>
        )}
        <form action={logout} className="mt-1 border-t border-border pt-1">
          <button className="menu-item w-full text-left text-danger">
            Cerrar sesión
          </button>
        </form>
      </AccountMenu>
    </>
  );
}
