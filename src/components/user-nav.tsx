import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { countUnread } from "@/lib/messages";
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
  const unread = await countUnread(user.id);
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
        <UnreadBadge initial={unread} />
      </Link>
      <Link href="/mi-cuenta" className="btn-primary whitespace-nowrap !px-3 !py-2">
        Mi colección
      </Link>
    </>
  );
}
