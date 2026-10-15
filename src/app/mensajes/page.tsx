import Link from "next/link";
import { Suspense } from "react";
import { createGroup } from "@/app/actions/messages";
import { ActionForm } from "@/components/action-form";
import { requireUser } from "@/lib/auth";
import { listConversations } from "@/lib/messages";

export const metadata = { title: "Mensajes" };

export default function MessagesPage() {
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-bold">Mensajes</h1>
      <details className="card p-3">
        <summary className="cursor-pointer font-semibold">+ Crear grupo</summary>
        <ActionForm action={createGroup} submit="Crear y sumar gente" className="mt-3 grid gap-3">
          <input
            name="name"
            required
            minLength={2}
            maxLength={60}
            placeholder="Nombre del grupo (ej: Figus Rosario)"
            className="input"
          />
        </ActionForm>
      </details>
      <Suspense fallback={<div className="card h-40 animate-pulse" />}>
        <Conversations />
      </Suspense>
    </div>
  );
}

async function Conversations() {
  const user = await requireUser();
  const list = await listConversations(user.id);
  if (!list.length) {
    return (
      <p className="text-sm text-muted">
        No tenés conversaciones todavía. Creá un grupo y sumá usuarios, o entrá al perfil de alguien
        (por ejemplo desde{" "}
        <Link href="/mi-cuenta/coincidencias" className="text-accent underline">
          Coincidencias
        </Link>
        ) y tocá &quot;Enviar mensaje&quot;.
      </p>
    );
  }
  return (
    <ul className="card divide-y divide-border">
      {list.map((c) => (
        <li key={c.id}>
          <Link href={`/mensajes/${c.id}`} className="flex items-center gap-3 p-3 hover:bg-background">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
                c.isDirect ? "bg-want" : "bg-have"
              }`}
            >
              {(c.name ?? c.others ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <span className="grid min-w-0 flex-1">
              <span className="truncate font-semibold">
                {c.name ?? c.others ?? "Chat sin miembros"}
              </span>
              <span className="truncate text-sm text-muted">
                {c.lastBody ?? (c.isDirect ? "Chat directo" : `Grupo · ${c.others ?? "solo vos"}`)}
              </span>
            </span>
            {c.unread > 0 && (
              <span className="rounded-full bg-accent px-2 text-xs font-bold leading-5 text-accent-fg">
                {c.unread}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
