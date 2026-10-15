import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Chat } from "@/components/chat";
import { requireUser } from "@/lib/auth";
import { getConversation, getMessages, markRead } from "@/lib/messages";

export default function ConversationPage({ params }: PageProps<"/mensajes/[id]">) {
  return (
    <Suspense fallback={<div className="card h-60 animate-pulse" />}>
      <Conversation params={params} />
    </Suspense>
  );
}

async function Conversation({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const user = await requireUser();
  const conv = await getConversation(id, user.id);
  if (!conv) notFound();
  const initial = await getMessages(id);
  if (initial.length) await markRead(id, user.id, initial.at(-1)!.id);
  const other = conv.isDirect ? conv.members.find((m) => m.id !== user.id) : undefined;

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Link href="/mensajes" className="btn-ghost !px-3 !py-1.5" aria-label="Volver">
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">
            {other ? (
              <Link href={`/usuario/${other.id}`} className="hover:text-accent">
                {conv.title}
              </Link>
            ) : (
              conv.title
            )}
          </h1>
          {!conv.isDirect && (
            <p className="truncate text-sm text-muted">
              {conv.members.map((m) => (m.id === user.id ? "Vos" : m.displayName)).join(", ")}
            </p>
          )}
        </div>
        <Link href={`/mensajes/${id}/miembros`} className="btn-ghost !py-1.5">
          {conv.isDirect ? "Opciones" : "Miembros"}
        </Link>
      </div>
      <Chat conversationId={id} meId={user.id} showAuthors={!conv.isDirect} initial={initial} />
    </div>
  );
}
