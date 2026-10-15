import "server-only";
import { and, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { List, NotificationKind } from "@/db/schema";
import { sendPush } from "./push";

const { notifications, userItems, users, items } = schema;

/** Texto de un aviso, igual en la campanita y en la notificación del navegador. */
export function notificationText(n: {
  kind: NotificationKind;
  count: number;
  detail: string | null;
  actorName: string | null;
}) {
  const who = n.actorName ?? "Alguien";
  const what = n.detail ?? "un ítem";
  if (n.kind === "coincidencia") {
    return n.count > 1
      ? { title: `${who} tiene ${n.count} que buscás`, body: `El último: ${what}. Escribile para cambiar.` }
      : { title: `${who} tiene algo que buscás`, body: `${what}. Escribile para cambiar.` };
  }
  return n.count > 1
    ? { title: `${who} busca ${n.count} que vos tenés`, body: `El último: ${what}. Puede ser un intercambio.` }
    : { title: `${who} busca algo que vos tenés`, body: `${what}. Puede ser un intercambio.` };
}

/**
 * Alguien acaba de marcar un ítem en "tengo" o "busco": avisa a los que
 * buscan (o tienen) ese mismo ítem. Agrupa por persona mientras no se lea.
 */
export async function notifyItemMatch(actorId: number, itemId: number, list: List) {
  const otherList = list === "tengo" ? "busco" : "tengo";
  const kind: NotificationKind = list === "tengo" ? "coincidencia" : "interesado";
  const [item, actor, recipients] = await Promise.all([
    db.select({ code: items.code, name: items.name }).from(items).where(eq(items.id, itemId)).get(),
    db.select({ name: users.displayName }).from(users).where(eq(users.id, actorId)).get(),
    db
      .select({ userId: userItems.userId })
      .from(userItems)
      .innerJoin(users, eq(users.id, userItems.userId))
      .where(
        and(
          eq(userItems.itemId, itemId),
          eq(userItems.list, otherList),
          ne(userItems.userId, actorId),
          eq(users.status, "approved"),
        ),
      )
      .limit(500),
  ]);
  if (!item || !actor || !recipients.length) return;

  const detail = item.code === item.name ? item.name : `${item.code} ${item.name}`;
  const groupKey = `${kind}:${actorId}`;
  const href = kind === "coincidencia" ? "/mi-cuenta/coincidencias" : `/usuario/${actorId}`;
  const ids = recipients.map((r) => r.userId);

  // Avisos sin leer que ya existen para esta persona: se actualizan.
  const open = await db
    .select({ id: notifications.id, userId: notifications.userId, count: notifications.count })
    .from(notifications)
    .where(
      and(
        inArray(notifications.userId, ids),
        eq(notifications.groupKey, groupKey),
        isNull(notifications.readAt),
      ),
    );
  const openByUser = new Map(open.map((o) => [o.userId, o]));
  const now = new Date();
  const fresh = ids.filter((id) => !openByUser.has(id));
  if (open.length) {
    await db
      .update(notifications)
      .set({ count: sql`${notifications.count} + 1`, detail, updatedAt: now })
      .where(inArray(notifications.id, open.map((o) => o.id)));
  }
  if (fresh.length) {
    await db.insert(notifications).values(
      fresh.map((userId) => ({ userId, kind, actorId, groupKey, detail, href, updatedAt: now })),
    );
  }

  // Notificación del navegador, agrupada con el mismo tag por persona.
  await Promise.all(
    ids.map((userId) => {
      const count = (openByUser.get(userId)?.count ?? 0) + 1;
      const text = notificationText({ kind, count, detail, actorName: actor.name });
      return sendPush([userId], { ...text, url: href, tag: groupKey });
    }),
  );
}

export async function countUnreadNotifications(userId: number) {
  const row = await db
    .select({ n: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .get();
  return row?.n ?? 0;
}

const rtf = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });

function timeAgo(d: Date, now: number) {
  const s = Math.round((d.getTime() - now) / 1000);
  if (s > -60) return "recién";
  if (s > -3600) return rtf.format(Math.round(s / 60), "minute");
  if (s > -86_400) return rtf.format(Math.round(s / 3600), "hour");
  if (s > -7 * 86_400) return rtf.format(Math.round(s / 86_400), "day");
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "America/Argentina/Buenos_Aires" });
}

export async function listNotifications(userId: number) {
  const rows = await db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      count: notifications.count,
      detail: notifications.detail,
      href: notifications.href,
      readAt: notifications.readAt,
      updatedAt: notifications.updatedAt,
      actorId: notifications.actorId,
      actorName: users.displayName,
      actorAvatarVersion: users.avatarVersion,
    })
    .from(notifications)
    .leftJoin(users, eq(users.id, notifications.actorId))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.updatedAt), desc(notifications.id))
    .limit(60);
  const now = Date.now();
  return rows.map((r) => ({ ...r, ...notificationText(r), ago: timeAgo(r.updatedAt, now) }));
}

export async function markNotificationsRead(userId: number) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
