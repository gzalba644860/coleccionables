import "server-only";
import { aliasedTable, and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import type { List } from "@/db/schema";

const { users, userItems, items, collections, contactMethods } = schema;

/** Usuarios que tienen (o buscan) un ítem. */
export async function getUsersForItem(itemId: number, list: List) {
  return db
    .select({
      userId: users.id,
      displayName: users.displayName,
      city: users.city,
      quantity: userItems.quantity,
      intent: userItems.intent,
      price: userItems.price,
      condition: userItems.condition,
      notes: userItems.notes,
    })
    .from(userItems)
    .innerJoin(users, eq(users.id, userItems.userId))
    .where(and(eq(userItems.itemId, itemId), eq(userItems.list, list)))
    .orderBy(desc(userItems.updatedAt))
    .limit(200);
}

/** Inventario de un usuario (lo que tiene o lo que busca). */
export async function getUserList(userId: number, list: List) {
  return db
    .select({
      rowId: userItems.id,
      itemId: items.id,
      code: items.code,
      name: items.name,
      variant: items.variant,
      imageKey: items.imageKey,
      collectionName: collections.name,
      collectionSlug: collections.slug,
      year: collections.year,
      quantity: userItems.quantity,
      intent: userItems.intent,
      price: userItems.price,
      notes: userItems.notes,
    })
    .from(userItems)
    .innerJoin(items, eq(items.id, userItems.itemId))
    .innerJoin(collections, eq(collections.id, items.collectionId))
    .where(and(eq(userItems.userId, userId), eq(userItems.list, list)))
    .orderBy(asc(collections.name), asc(items.sortOrder));
}

/** Para pintar el estado "tengo/busco" de varios ítems de una vez. */
export async function getStatusForItems(userId: number, itemIds: number[]) {
  const status: Record<number, { tengo?: number; busco?: boolean }> = {};
  if (!itemIds.length) return status;
  const rows = await db
    .select({
      itemId: userItems.itemId,
      list: userItems.list,
      quantity: userItems.quantity,
    })
    .from(userItems)
    .where(
      and(eq(userItems.userId, userId), inArray(userItems.itemId, itemIds)),
    );
  for (const r of rows) {
    status[r.itemId] ??= {};
    if (r.list === "tengo") status[r.itemId].tengo = r.quantity;
    else status[r.itemId].busco = true;
  }
  return status;
}

/**
 * Coincidencias: lo que yo busco y otro tiene. Marca "mutual" cuando ese
 * otro usuario además busca algo que yo tengo (intercambio posible).
 */
export async function getMatches(userId: number) {
  const mine = aliasedTable(userItems, "mine");
  const theirs = aliasedTable(userItems, "theirs");

  const iWantTheyHave = await db
    .select({
      otherId: users.id,
      otherName: users.displayName,
      city: users.city,
      itemId: items.id,
      code: items.code,
      name: items.name,
      imageKey: items.imageKey,
      collectionName: collections.name,
      intent: theirs.intent,
      price: theirs.price,
    })
    .from(mine)
    .innerJoin(
      theirs,
      and(
        eq(theirs.itemId, mine.itemId),
        eq(theirs.list, "tengo"),
        ne(theirs.userId, userId),
      ),
    )
    .innerJoin(users, eq(users.id, theirs.userId))
    .innerJoin(items, eq(items.id, mine.itemId))
    .innerJoin(collections, eq(collections.id, items.collectionId))
    .where(and(eq(mine.userId, userId), eq(mine.list, "busco")))
    .limit(500);

  const theyWantIHave = await db
    .select({ otherId: theirs.userId, itemId: theirs.itemId })
    .from(mine)
    .innerJoin(
      theirs,
      and(
        eq(theirs.itemId, mine.itemId),
        eq(theirs.list, "busco"),
        ne(theirs.userId, userId),
      ),
    )
    .where(and(eq(mine.userId, userId), eq(mine.list, "tengo")))
    .limit(2000);

  const giveCount = new Map<number, number>();
  for (const r of theyWantIHave) {
    giveCount.set(r.otherId, (giveCount.get(r.otherId) ?? 0) + 1);
  }

  // Agrupado por usuario, los de intercambio mutuo primero.
  const byUser = new Map<
    number,
    {
      otherId: number;
      otherName: string;
      city: string | null;
      canGive: number;
      items: typeof iWantTheyHave;
    }
  >();
  for (const r of iWantTheyHave) {
    let g = byUser.get(r.otherId);
    if (!g) {
      g = {
        otherId: r.otherId,
        otherName: r.otherName,
        city: r.city,
        canGive: giveCount.get(r.otherId) ?? 0,
        items: [],
      };
      byUser.set(r.otherId, g);
    }
    g.items.push(r);
  }
  return [...byUser.values()].sort(
    (a, b) => b.canGive - a.canGive || b.items.length - a.items.length,
  );
}

export async function getPublicProfile(userId: number) {
  const row = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      city: users.city,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  return row ?? null;
}

export async function getContacts(userId: number) {
  return db
    .select({
      id: contactMethods.id,
      kind: contactMethods.kind,
      value: contactMethods.value,
    })
    .from(contactMethods)
    .where(eq(contactMethods.userId, userId));
}
