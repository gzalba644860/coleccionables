"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import {
  getMessages,
  isMember,
  markRead,
  type ChatMessage,
} from "@/lib/messages";
import { sendPush } from "@/lib/push";
import type { FormState } from "./auth";

const { conversations, conversationMembers, messages, users } = schema;

const groupSchema = z.object({
  name: z.string().trim().min(2, "Poné un nombre de al menos 2 letras").max(60),
});

export async function createGroup(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = groupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const [conv] = await db
    .insert(conversations)
    .values({ name: parsed.data.name, createdBy: user.id })
    .returning({ id: conversations.id });
  await db.insert(conversationMembers).values({ conversationId: conv.id, userId: user.id });
  redirect(`/mensajes/${conv.id}/miembros`);
}

/** Abre (o crea) el chat directo con otro usuario. */
export async function openDirect(otherId: number) {
  const user = await requireUser();
  if (otherId === user.id) redirect("/mensajes");
  const other = await db.select({ id: users.id }).from(users).where(eq(users.id, otherId)).get();
  if (!other) redirect("/mensajes");

  const key = [user.id, otherId].sort((a, b) => a - b).join(":");
  let conv = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.directKey, key))
    .get();
  if (!conv) {
    [conv] = await db
      .insert(conversations)
      .values({ isDirect: true, directKey: key, createdBy: user.id })
      .onConflictDoNothing()
      .returning({ id: conversations.id });
    conv ??= await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.directKey, key))
      .get();
  }
  // Si alguno había salido del chat, vuelve a entrar.
  await db
    .insert(conversationMembers)
    .values([
      { conversationId: conv!.id, userId: user.id },
      { conversationId: conv!.id, userId: otherId },
    ])
    .onConflictDoNothing();
  redirect(`/mensajes/${conv!.id}`);
}

const bodySchema = z.string().trim().min(1).max(2000);

export async function sendMessage(
  conversationId: number,
  text: string,
  afterId: number,
): Promise<ChatMessage[] | { error: string }> {
  const user = await requireUser();
  const body = bodySchema.safeParse(text);
  if (!body.success) return { error: "El mensaje está vacío o es muy largo" };
  if (!(await isMember(conversationId, user.id))) return { error: "No sos parte de este chat" };

  await db.insert(messages).values({ conversationId, userId: user.id, body: body.data });
  // En un chat directo, si el otro lo había borrado, le vuelve a aparecer.
  const conv = await db
    .select({ directKey: conversations.directKey })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .get();
  if (conv?.directKey) {
    await db
      .insert(conversationMembers)
      .values(conv.directKey.split(":").map((id) => ({ conversationId, userId: Number(id) })))
      .onConflictDoNothing();
  }
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));
  after(() =>
    pushNewMessage(conversationId, user.id, user.displayName, body.data).catch((e) =>
      console.error("avisos", e),
    ),
  );
  // Devuelve también lo que llegó mientras tanto.
  const fresh = await getMessages(conversationId, afterId);
  if (fresh.length) await markRead(conversationId, user.id, fresh.at(-1)!.id);
  return fresh;
}

/** Notificación del navegador a los demás miembros del chat. */
async function pushNewMessage(conversationId: number, fromId: number, fromName: string, text: string) {
  const [conv, members] = await Promise.all([
    db
      .select({ name: conversations.name })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .get(),
    db
      .select({ userId: conversationMembers.userId })
      .from(conversationMembers)
      .where(eq(conversationMembers.conversationId, conversationId)),
  ]);
  const to = members.map((m) => m.userId).filter((id) => id !== fromId);
  const preview = text.length > 120 ? `${text.slice(0, 117)}…` : text;
  await sendPush(to, {
    title: conv?.name ? `${fromName} en ${conv.name}` : `Mensaje de ${fromName}`,
    body: preview,
    url: `/mensajes/${conversationId}`,
    tag: `chat-${conversationId}`,
  });
}

/** Consulta periódica del chat abierto: mensajes nuevos y los marca como leídos. */
export async function pollMessages(conversationId: number, afterId: number) {
  const user = await requireUser();
  if (!(await isMember(conversationId, user.id))) return [];
  const fresh = await getMessages(conversationId, afterId);
  if (fresh.length) await markRead(conversationId, user.id, fresh.at(-1)!.id);
  return fresh;
}

export async function addMember(conversationId: number, userId: number) {
  const user = await requireUser();
  const conv = await db
    .select({ isDirect: conversations.isDirect })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .get();
  if (!conv || conv.isDirect || !(await isMember(conversationId, user.id))) return;
  await db.insert(conversationMembers).values({ conversationId, userId }).onConflictDoNothing();
  refresh();
}

export async function leaveConversation(conversationId: number) {
  const user = await requireUser();
  await db
    .delete(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, user.id),
      ),
    );
  const left = await db
    .select({ id: conversationMembers.userId })
    .from(conversationMembers)
    .where(eq(conversationMembers.conversationId, conversationId))
    .get();
  if (!left) {
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
    await db.delete(conversations).where(eq(conversations.id, conversationId));
  }
  redirect("/mensajes");
}
