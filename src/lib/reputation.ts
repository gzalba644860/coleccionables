import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { ratings, users, conversations, messages } = schema;

export type Reputation = { avg: number; count: number };

/** Promedio y cantidad de calificaciones recibidas de varios usuarios. */
export async function getReputations(userIds: number[]) {
  const out: Record<number, Reputation> = {};
  if (!userIds.length) return out;
  const rows = await db
    .select({
      userId: ratings.ratedId,
      avg: sql<number>`avg(${ratings.stars})`,
      count: sql<number>`count(*)`,
    })
    .from(ratings)
    .where(inArray(ratings.ratedId, userIds))
    .groupBy(ratings.ratedId);
  for (const r of rows) out[r.userId] = { avg: Number(r.avg), count: Number(r.count) };
  return out;
}

export async function getReputation(userId: number): Promise<Reputation> {
  return (await getReputations([userId]))[userId] ?? { avg: 0, count: 0 };
}

/** Cuántas calificaciones hay de cada cantidad de estrellas (índice 0 = 1 estrella). */
export async function getStarBreakdown(userId: number) {
  const rows = await db
    .select({ stars: ratings.stars, n: sql<number>`count(*)` })
    .from(ratings)
    .where(eq(ratings.ratedId, userId))
    .groupBy(ratings.stars);
  const out = [0, 0, 0, 0, 0];
  for (const r of rows) if (r.stars >= 1 && r.stars <= 5) out[r.stars - 1] = Number(r.n);
  return out;
}

/** Últimas opiniones recibidas, con quién las dejó. */
export async function getReviews(userId: number, limit = 20) {
  return db
    .select({
      id: ratings.id,
      stars: ratings.stars,
      comment: ratings.comment,
      at: ratings.updatedAt,
      rater: {
        id: users.id,
        displayName: users.displayName,
        avatarVersion: users.avatarVersion,
      },
    })
    .from(ratings)
    .innerJoin(users, eq(users.id, ratings.raterId))
    .where(eq(ratings.ratedId, userId))
    .orderBy(desc(ratings.updatedAt))
    .limit(limit);
}

export async function getMyRating(raterId: number, ratedId: number) {
  return (
    (await db
      .select({ stars: ratings.stars, comment: ratings.comment })
      .from(ratings)
      .where(and(eq(ratings.raterId, raterId), eq(ratings.ratedId, ratedId)))
      .get()) ?? null
  );
}

/**
 * Puede calificar quien tuvo un chat directo con el otro en el que
 * escribieron los dos: así solo opinan quienes realmente coordinaron algo.
 */
export async function canRate(raterId: number, ratedId: number) {
  if (raterId === ratedId) return false;
  const key = [raterId, ratedId].sort((a, b) => a - b).join(":");
  const row = await db
    .select({ n: sql<number>`count(distinct ${messages.userId})` })
    .from(conversations)
    .innerJoin(messages, eq(messages.conversationId, conversations.id))
    .where(
      and(eq(conversations.directKey, key), inArray(messages.userId, [raterId, ratedId])),
    )
    .get();
  return Number(row?.n ?? 0) >= 2;
}
