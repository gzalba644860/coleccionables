import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { addMember, leaveConversation } from "@/app/actions/messages";
import { requireUser } from "@/lib/auth";
import { getConversation, searchUsers } from "@/lib/messages";

export default function MembersPage({ params, searchParams }: PageProps<"/mensajes/[id]/miembros">) {
  return (
    <Suspense fallback={<div className="card h-60 animate-pulse" />}>
      <Members params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Members({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const q = String((await searchParams).q ?? "");
  const user = await requireUser();
  const conv = await getConversation(id, user.id);
  if (!conv) notFound();
  const results = conv.isDirect ? [] : await searchUsers(q, conv.members.map((m) => m.id));

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        <Link href={`/mensajes/${id}`} className="btn-ghost !px-3 !py-1.5" aria-label="Volver al chat">
          ←
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold">{conv.title}</h1>
        <Link href={`/mensajes/${id}`} className="btn-primary !py-1.5">
          Ir al chat
        </Link>
      </div>

      {!conv.isDirect && (
        <section className="card grid gap-3 p-3">
          <h2 className="font-semibold">Sumar usuarios</h2>
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre"
              minLength={2}
              className="input flex-1"
              autoFocus={conv.members.length < 2}
            />
            <button className="btn-ghost">Buscar</button>
          </form>
          {q.trim().length >= 2 && results.length === 0 && (
            <p className="text-sm text-muted">No encontramos a nadie con ese nombre (o ya está en el grupo).</p>
          )}
          {results.length > 0 && (
            <ul className="divide-y divide-border">
              {results.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    {u.displayName}
                    {u.city && <span className="text-sm text-muted"> · {u.city}</span>}
                  </span>
                  <form action={addMember.bind(null, id, u.id)}>
                    <button className="btn-primary !py-1.5">Agregar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="grid gap-2">
        <h2 className="font-semibold">Miembros ({conv.members.length})</h2>
        <ul className="card divide-y divide-border">
          {conv.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 p-3">
              <Link href={`/usuario/${m.id}`} className="underline">
                {m.id === user.id ? `${m.displayName} (vos)` : m.displayName}
              </Link>
              {m.city && <span className="text-sm text-muted">{m.city}</span>}
            </li>
          ))}
        </ul>
      </section>

      <form action={leaveConversation.bind(null, id)}>
        <button className="btn-ghost text-danger">
          {conv.isDirect ? "Borrar de mis mensajes" : "Salir del grupo"}
        </button>
      </form>
    </div>
  );
}
