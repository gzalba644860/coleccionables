import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

const { itemTypes, brands, collections, items, userItems } = schema;

/* El catálogo cambia poco: se cachea y se invalida con updateTag("catalog")
 * cuando un admin lo modifica. Esto además ahorra lecturas en Turso. */

export type CatalogTree = Awaited<ReturnType<typeof getCatalogTree>>;

export async function getCatalogTree() {
  "use cache";
  cacheTag("catalog");
  cacheLife("hours");
  const [types, brandRows, collectionRows] = await Promise.all([
    db.select().from(itemTypes).orderBy(asc(itemTypes.name)),
    db.select().from(brands).orderBy(asc(brands.name)),
    db
      .select({
        id: collections.id,
        slug: collections.slug,
        name: collections.name,
        typeId: collections.typeId,
        brandId: collections.brandId,
        year: collections.year,
        totalItems: collections.totalItems,
        coverImageKey: collections.coverImageKey,
      })
      .from(collections)
      .orderBy(sql`${collections.year} desc`, asc(collections.name)),
  ]);
  return { types, brands: brandRows, collections: collectionRows };
}

export async function getCollectionBySlug(slug: string) {
  "use cache";
  cacheTag("catalog");
  cacheLife("hours");
  const row = await db
    .select({
      id: collections.id,
      slug: collections.slug,
      name: collections.name,
      year: collections.year,
      totalItems: collections.totalItems,
      coverImageKey: collections.coverImageKey,
      typeName: itemTypes.name,
      brandName: brands.name,
    })
    .from(collections)
    .innerJoin(itemTypes, eq(itemTypes.id, collections.typeId))
    .innerJoin(brands, eq(brands.id, collections.brandId))
    .where(eq(collections.slug, slug))
    .get();
  return row ?? null;
}

export type CatalogItem = {
  id: number;
  code: string;
  name: string;
  section: string | null;
  variant: string;
  rarity: string | null;
  imageKey: string | null;
};

export async function getCollectionItems(
  collectionId: number,
): Promise<CatalogItem[]> {
  "use cache";
  cacheTag("catalog");
  cacheLife("hours");
  return db
    .select({
      id: items.id,
      code: items.code,
      name: items.name,
      section: items.section,
      variant: items.variant,
      rarity: items.rarity,
      imageKey: items.imageKey,
    })
    .from(items)
    .where(eq(items.collectionId, collectionId))
    .orderBy(asc(items.sortOrder), asc(items.id));
}

export async function getItem(id: number) {
  "use cache";
  cacheTag("catalog");
  cacheLife("hours");
  const row = await db
    .select({
      id: items.id,
      code: items.code,
      name: items.name,
      section: items.section,
      variant: items.variant,
      rarity: items.rarity,
      imageKey: items.imageKey,
      collectionName: collections.name,
      collectionSlug: collections.slug,
      year: collections.year,
      brandName: brands.name,
      typeName: itemTypes.name,
    })
    .from(items)
    .innerJoin(collections, eq(collections.id, items.collectionId))
    .innerJoin(brands, eq(brands.id, collections.brandId))
    .innerJoin(itemTypes, eq(itemTypes.id, collections.typeId))
    .where(eq(items.id, id))
    .get();
  return row ?? null;
}

export type SearchFilters = {
  type?: number;
  brand?: number;
  year?: number;
  collection?: number;
  q?: string;
};

/** Búsqueda de ítems del catálogo con cantidad de usuarios que lo tienen/buscan. */
export async function searchItems(f: SearchFilters, limit = 60) {
  const where: SQL[] = [];
  if (f.type) where.push(eq(collections.typeId, f.type));
  if (f.brand) where.push(eq(collections.brandId, f.brand));
  if (f.year) where.push(eq(collections.year, f.year));
  if (f.collection) where.push(eq(items.collectionId, f.collection));
  if (f.q?.trim()) {
    const term = `%${f.q.trim()}%`;
    where.push(or(like(items.name, term), like(items.code, term), like(items.section, term))!);
  }

  const countFor = (list: "tengo" | "busco") =>
    sql<number>`(select count(*) from ${userItems} ui where ui.item_id = ${items.id} and ui.list = ${list})`;

  return db
    .select({
      id: items.id,
      code: items.code,
      name: items.name,
      section: items.section,
      variant: items.variant,
      imageKey: items.imageKey,
      collectionName: collections.name,
      year: collections.year,
      brandName: brands.name,
      holders: countFor("tengo"),
      seekers: countFor("busco"),
    })
    .from(items)
    .innerJoin(collections, eq(collections.id, items.collectionId))
    .innerJoin(brands, eq(brands.id, collections.brandId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(sql`${collections.year} desc`, asc(collections.name), asc(items.sortOrder))
    .limit(limit);
}

/** Hasta 3 imágenes repartidas por colección, para armar la portada en abanico. */
export async function getCollectionPreviews(): Promise<Record<number, string[]>> {
  "use cache";
  cacheTag("catalog");
  cacheLife("hours");
  const rows = await db.all<{ collection_id: number; image_key: string }>(sql`
    select collection_id, image_key from (
      select collection_id, image_key,
        row_number() over (partition by collection_id order by id) as rn,
        count(*) over (partition by collection_id) as cnt
      from ${items} where image_key is not null
    ) where rn in (1 + cnt / 9, 1 + cnt / 3, 1 + cnt * 5 / 9)
    order by collection_id, rn`);
  const out: Record<number, string[]> = {};
  for (const r of rows) (out[r.collection_id] ??= []).push(r.image_key);
  return out;
}

/** Números de la comunidad para la portada (se recalculan cada tanto, no en cada visita). */
export async function getCommunityStats() {
  "use cache";
  cacheLife("hours");
  const [row] = await db.all<{ users: number; offered: number; wanted: number }>(sql`
    select
      (select count(*) from ${schema.users} where status = 'approved') as users,
      (select coalesce(sum(quantity), 0) from ${userItems} where list = 'tengo') as offered,
      (select count(*) from ${userItems} where list = 'busco') as wanted`);
  return row ?? { users: 0, offered: 0, wanted: 0 };
}
