"use server";

import { refresh } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { canRate } from "@/lib/reputation";
import type { FormState } from "./auth";

const { ratings } = schema;

const ratingSchema = z.object({
  stars: z.coerce.number().int().min(1, "Elegí de 1 a 5 estrellas").max(5),
  comment: z.string().trim().max(300, "El comentario puede tener hasta 300 caracteres").optional(),
});

/** Marca el intercambio como hecho y deja (o actualiza) la calificación. */
export async function rateUser(ratedId: number, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = ratingSchema.safeParse({
    stars: formData.get("stars") ?? 0,
    comment: formData.get("comment") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await canRate(user.id, ratedId))) {
    return { error: "Para calificar, primero coordiná el intercambio por mensaje." };
  }
  const values = { stars: parsed.data.stars, comment: parsed.data.comment || null };
  await db
    .insert(ratings)
    .values({ raterId: user.id, ratedId, ...values })
    .onConflictDoUpdate({
      target: [ratings.raterId, ratings.ratedId],
      set: { ...values, updatedAt: sql`(unixepoch())` },
    });
  refresh();
  return { ok: "¡Gracias! Tu calificación quedó guardada." };
}

export async function removeRating(ratedId: number) {
  const user = await requireUser();
  await db
    .delete(ratings)
    .where(and(eq(ratings.raterId, user.id), eq(ratings.ratedId, ratedId)));
  refresh();
}
