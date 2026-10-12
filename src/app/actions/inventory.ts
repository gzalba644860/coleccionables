"use server";

import { refresh } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { INTENTS, LISTS } from "@/db/schema";
import { requireUser } from "@/lib/auth";

const { userItems } = schema;

/** Marca/desmarca un ítem en "tengo" o "busco" (botones rápidos del álbum). */
export async function toggleItem(itemId: number, list: (typeof LISTS)[number]) {
  const user = await requireUser();
  const where = and(
    eq(userItems.userId, user.id),
    eq(userItems.itemId, itemId),
    eq(userItems.list, list),
  );
  const existing = await db.select({ id: userItems.id }).from(userItems).where(where).get();
  if (existing) {
    await db.delete(userItems).where(eq(userItems.id, existing.id));
  } else {
    await db.insert(userItems).values({ userId: user.id, itemId, list });
    // Si ahora lo tengo, ya no lo busco (y viceversa).
    const other = list === "tengo" ? "busco" : "tengo";
    await db
      .delete(userItems)
      .where(
        and(
          eq(userItems.userId, user.id),
          eq(userItems.itemId, itemId),
          eq(userItems.list, other),
        ),
      );
  }
  refresh();
}

/** Sumar/restar repetidas en "tengo". */
export async function changeQuantity(itemId: number, delta: 1 | -1) {
  const user = await requireUser();
  const where = and(
    eq(userItems.userId, user.id),
    eq(userItems.itemId, itemId),
    eq(userItems.list, "tengo"),
  );
  if (delta > 0) {
    await db
      .insert(userItems)
      .values({ userId: user.id, itemId, list: "tengo" })
      .onConflictDoUpdate({
        target: [userItems.userId, userItems.itemId, userItems.list],
        set: { quantity: sql`${userItems.quantity} + 1`, updatedAt: new Date() },
      });
  } else {
    const row = await db.select({ q: userItems.quantity }).from(userItems).where(where).get();
    if (!row) return;
    if (row.q <= 1) await db.delete(userItems).where(where);
    else await db.update(userItems).set({ quantity: row.q - 1 }).where(where);
  }
  refresh();
}

const detailsSchema = z.object({
  itemId: z.coerce.number().int().positive(),
  intent: z.enum(INTENTS),
  price: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? Number(v) : null))
    .pipe(z.number().int().nonnegative().nullable()),
  notes: z.string().trim().max(200).optional(),
});

/** Detalles de una publicación "tengo": venta/intercambio, precio, notas. */
export async function updateDetails(formData: FormData) {
  const user = await requireUser();
  const d = detailsSchema.parse(Object.fromEntries(formData));
  await db
    .update(userItems)
    .set({ intent: d.intent, price: d.price, notes: d.notes || null, updatedAt: new Date() })
    .where(
      and(
        eq(userItems.userId, user.id),
        eq(userItems.itemId, d.itemId),
        eq(userItems.list, "tengo"),
      ),
    );
  refresh();
}
