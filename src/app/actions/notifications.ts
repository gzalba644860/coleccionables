"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { countUnread } from "@/lib/messages";
import { countUnreadNotifications, markNotificationsRead } from "@/lib/notifications";
import { getVapidPublicKey } from "@/lib/push";

const { pushSubscriptions } = schema;

/** Contadores del menú: mensajes sin leer y avisos nuevos. */
export async function pollCounts() {
  const user = await requireUser();
  const [mensajes, avisos] = await Promise.all([
    countUnread(user.id),
    countUnreadNotifications(user.id),
  ]);
  return { mensajes, avisos };
}

export async function markAvisosRead() {
  const user = await requireUser();
  await markNotificationsRead(user.id);
}

export async function getPushKey() {
  await requireUser();
  return getVapidPublicKey();
}

const subSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

/** Guarda la suscripción de este dispositivo (si era de otra cuenta, pasa a esta). */
export async function savePushSubscription(raw: unknown) {
  const user = await requireUser();
  const sub = subSchema.parse(raw);
  await db
    .insert(pushSubscriptions)
    .values({ userId: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
}

export async function removePushSubscription(endpoint: string) {
  const user = await requireUser();
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)));
}
