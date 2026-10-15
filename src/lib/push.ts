import "server-only";
import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";

const { appSettings, pushSubscriptions } = schema;

/**
 * Claves VAPID de las notificaciones del navegador. Se generan solas la
 * primera vez y quedan guardadas en la base: no hace falta configurar nada.
 */
let keys: Promise<{ publicKey: string; privateKey: string }> | undefined;

function loadKeys() {
  keys ??= (async () => {
    const read = () =>
      db.select().from(appSettings).where(eq(appSettings.key, "vapid")).get();
    let row = await read();
    if (!row) {
      const fresh = webpush.generateVAPIDKeys();
      await db
        .insert(appSettings)
        .values({ key: "vapid", value: JSON.stringify(fresh) })
        .onConflictDoNothing();
      row = await read();
    }
    return JSON.parse(row!.value);
  })().catch((e) => {
    keys = undefined;
    throw e;
  });
  return keys;
}

export async function getVapidPublicKey() {
  return (await loadKeys()).publicKey;
}

export type PushPayload = {
  title: string;
  body: string;
  /** Página que se abre al tocar el aviso. */
  url: string;
  /** Avisos con el mismo tag se reemplazan (p.ej. un chat). */
  tag?: string;
};

/** Manda el aviso a todos los dispositivos donde el usuario lo activó. */
export async function sendPush(userIds: number[], payload: PushPayload) {
  if (!userIds.length) return;
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds));
  if (!subs.length) return;
  const { publicKey, privateKey } = await loadKeys();
  const options = {
    vapidDetails: {
      subject: process.env.PUSH_CONTACT ?? "mailto:avisos@coleccionables.app",
      publicKey,
      privateKey,
    },
    TTL: 60 * 60 * 24,
  };
  const body = JSON.stringify(payload);
  const gone: number[] = [];
  await Promise.all(
    subs.map((s) =>
      webpush
        .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, options)
        .catch((err: { statusCode?: number }) => {
          // 404/410: el navegador dio de baja la suscripción.
          if (err?.statusCode === 404 || err?.statusCode === 410) gone.push(s.id);
          else console.error("push", err);
        }),
    ),
  );
  if (gone.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, gone));
}
