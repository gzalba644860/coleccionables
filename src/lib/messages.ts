import "server-only";
import { and, desc, eq, gt, like, notInArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { conversations, conversationMembers, messages, users } = schema;

/** Conversaciones del usuario, la de actividad más reciente primero. */
export async function listConversations(userId: number) {
  return db
    .select({
      id: conversations.id,
      name: conversations.name,
      isDirect: conversations.isDirect,
      lastMessageAt: conversations.lastMessageAt,
      unread: sql<number>`(select count(*) from messages m
        where m.conversation_id = ${conversations.id}
          and m.id > ${conversationMembers.lastReadId}
          and m.user_id <> ${userId})`,
      lastBody: sql<string | null>`(select m.body from messages m
        where m.conversation_id = ${conversations.id} order by m.id desc limit 1)`,
      others: sql<string | null>`(select group_concat(u.display_name, ', ')
        from conversation_members cm join users u on u.id = cm.user_id
        where cm.conversation_id = ${conversations.id} and cm.user_id <> ${userId})`,
    })
    .from(conversationMembers)
    .innerJoin(conversations, eq(conversations.id, conversationMembers.conversationId))
    .where(eq(conversationMembers.userId, userId))
    .orderBy(desc(sql`coalesce(${conversations.lastMessageAt}, ${conversations.createdAt})`))
    .limit(200);
}

/** Total de mensajes sin leer (para el globito del menú). */
export async function countUnread(userId: number) {
  const row = await db
    .select({ n: sql<number>`count(*)` })
    .from(conversationMembers)
    .innerJoin(
      messages,
      and(
        eq(messages.conversationId, conversationMembers.conversationId),
        gt(messages.id, conversationMembers.lastReadId),
      ),
    )
    .where(and(eq(conversationMembers.userId, userId), sql`${messages.userId} <> ${userId}`))
    .get();
  return row?.n ?? 0;
}

export async function isMember(conversationId: number, userId: number) {
  const row = await db
    .select({ id: conversationMembers.userId })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    )
    .get();
  return !!row;
}

/** Conversación con sus miembros, o null si no existe o el usuario no es miembro. */
export async function getConversation(conversationId: number, userId: number) {
  if (!(await isMember(conversationId, userId))) return null;
  const [conv, members] = await Promise.all([
    db.select().from(conversations).where(eq(conversations.id, conversationId)).get(),
    db
      .select({ id: users.id, displayName: users.displayName, city: users.city })
      .from(conversationMembers)
      .innerJoin(users, eq(users.id, conversationMembers.userId))
      .where(eq(conversationMembers.conversationId, conversationId))
      .orderBy(users.displayName),
  ]);
  if (!conv) return null;
  const others = members.filter((m) => m.id !== userId);
  const title = conv.name ?? (others.map((m) => m.displayName).join(", ") || "Chat");
  return { ...conv, title, members };
}

export type ChatMessage = {
  id: number;
  userId: number;
  author: string;
  body: string;
  at: number;
};

/** Últimos mensajes (o los posteriores a afterId), en orden cronológico. */
export async function getMessages(conversationId: number, afterId = 0, limit = 100) {
  const rows = await db
    .select({
      id: messages.id,
      userId: messages.userId,
      author: users.displayName,
      body: messages.body,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.userId))
    .where(and(eq(messages.conversationId, conversationId), gt(messages.id, afterId)))
    .orderBy(desc(messages.id))
    .limit(limit);
  return rows.reverse().map(
    (r): ChatMessage => ({
      id: r.id,
      userId: r.userId,
      author: r.author,
      body: r.body,
      at: r.createdAt.getTime(),
    }),
  );
}

export async function markRead(conversationId: number, userId: number, lastId: number) {
  await db
    .update(conversationMembers)
    .set({ lastReadId: sql`max(${conversationMembers.lastReadId}, ${lastId})` })
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    );
}

/** Usuarios por nombre para sumar a un grupo (excluye a los que ya están). */
export async function searchUsers(q: string, excludeIds: number[]) {
  const term = q.trim();
  if (term.length < 2) return [];
  return db
    .select({ id: users.id, displayName: users.displayName, city: users.city })
    .from(users)
    .where(
      and(
        like(users.displayName, `%${term.replace(/[%_]/g, "")}%`),
        excludeIds.length ? notInArray(users.id, excludeIds) : undefined,
      ),
    )
    .orderBy(users.displayName)
    .limit(20);
}
