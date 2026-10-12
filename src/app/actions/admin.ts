"use server";

import { updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/images";
import type { FormState } from "./auth";

const nameSchema = z.object({ name: z.string().trim().min(2).max(60) });

export async function createType(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const p = nameSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) return { error: "Nombre inválido" };
  await db
    .insert(schema.itemTypes)
    .values({ name: p.data.name, slug: slugify(p.data.name) })
    .onConflictDoNothing();
  updateTag("catalog");
  return { ok: `Tipo "${p.data.name}" creado` };
}

export async function createBrand(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const p = nameSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) return { error: "Nombre inválido" };
  await db
    .insert(schema.brands)
    .values({ name: p.data.name, slug: slugify(p.data.name) })
    .onConflictDoNothing();
  updateTag("catalog");
  return { ok: `Marca "${p.data.name}" creada` };
}

const collectionSchema = z.object({
  name: z.string().trim().min(2).max(80),
  typeId: z.coerce.number().int().positive(),
  brandId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().min(1900).max(2100),
  totalItems: z.coerce.number().int().nonnegative().optional(),
});

export async function createCollection(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const p = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) return { error: "Revisá los datos de la colección" };
  const brand = await db
    .select({ slug: schema.brands.slug })
    .from(schema.brands)
    .where(eq(schema.brands.id, p.data.brandId))
    .get();
  if (!brand) return { error: "Marca inexistente" };
  const slug = `${brand.slug}-${slugify(p.data.name)}-${p.data.year}`;
  await db
    .insert(schema.collections)
    .values({ ...p.data, slug, totalItems: p.data.totalItems || null })
    .onConflictDoNothing();
  updateTag("catalog");
  return { ok: `Colección creada (${slug})` };
}

/**
 * Carga masiva de ítems. Una línea por ítem:
 *   codigo;nombre[;variante[;clave_imagen]]
 * Si no se indica clave de imagen se usa "<slug-coleccion>/<codigo>.webp",
 * así basta con subir las imágenes al bucket con ese nombre.
 */
export async function bulkItems(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const collectionId = Number(formData.get("collectionId"));
  const text = String(formData.get("lines") ?? "");
  const collection = await db
    .select({ id: schema.collections.id, slug: schema.collections.slug })
    .from(schema.collections)
    .where(eq(schema.collections.id, collectionId))
    .get();
  if (!collection) return { error: "Elegí una colección" };

  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [code, name, variant, imageKey] = line.split(";").map((s) => s?.trim());
      return {
        collectionId,
        code,
        name: name || code,
        variant: variant || "normal",
        imageKey: imageKey || `${collection.slug}/${slugify(code)}.webp`,
        sortOrder: i,
      };
    })
    .filter((r) => r.code);
  if (!rows.length) return { error: "No hay líneas válidas" };

  for (let i = 0; i < rows.length; i += 100) {
    await db
      .insert(schema.items)
      .values(rows.slice(i, i + 100))
      .onConflictDoNothing();
  }
  updateTag("catalog");
  return { ok: `${rows.length} ítems procesados` };
}
