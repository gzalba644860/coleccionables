import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { PushToggle } from "@/components/push-toggle";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/notifications";
import { MarkRead } from "./mark-read";

export const metadata = { title: "Avisos" };

export default function AvisosPage() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-5">
      <div>
        <h1 className="page-title">Avisos</h1>
        <p className="text-sm text-muted">
          Te avisamos cuando alguien tiene una figurita que buscás o busca una que tenés.
        </p>
      </div>
      <PushToggle />
      <Suspense fallback={<div className="card h-48 animate-pulse" />}>
        <AvisosList />
      </Suspense>
    </div>
  );
}

async function AvisosList() {
  const user = await requireUser();
  const list = await listNotifications(user.id);
  const pending = list.some((n) => !n.readAt);

  if (!list.length) {
    return (
      <div className="card grid justify-items-center gap-2 p-8 text-center">
        <p className="font-semibold">Todavía no tenés avisos</p>
        <p className="max-w-sm text-sm text-muted">
          Marcá las figuritas que buscás y las repetidas que tenés: cuando alguien tenga lo tuyo
          o busque lo que te sobra, te avisamos acá.
        </p>
        <Link href="/mi-cuenta" className="btn-primary mt-2">
          Ir a mi colección
        </Link>
      </div>
    );
  }

  return (
    <>
      <MarkRead pending={pending} />
      <ul className="card divide-y divide-border overflow-hidden">
        {list.map((n) => (
          <li key={n.id}>
            <Link
              href={n.href}
              className={`flex items-start gap-3 p-3.5 transition hover:bg-subtle ${
                n.readAt ? "" : "bg-accent/5"
              }`}
            >
              <span className="relative">
                {n.actorId && n.actorName ? (
                  <Avatar
                    user={{
                      id: n.actorId,
                      displayName: n.actorName,
                      avatarVersion: n.actorAvatarVersion ?? 0,
                    }}
                    size={42}
                  />
                ) : (
                  <span className="block size-[42px] rounded-full bg-subtle" />
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-card ${
                    n.kind === "coincidencia" ? "bg-have" : "bg-want"
                  }`}
                  aria-hidden
                >
                  {n.kind === "coincidencia" ? "✓" : "?"}
                </span>
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className={n.readAt ? "font-medium" : "font-semibold"}>{n.title}</span>
                <span className="text-sm text-muted">{n.body}</span>
                <span className="text-xs text-muted">{n.ago}</span>
              </span>
              {!n.readAt && (
                <span className="mt-2 size-2.5 shrink-0 rounded-full bg-accent" aria-label="Nuevo" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
