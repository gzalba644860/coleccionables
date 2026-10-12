/**
 * Datos de ejemplo para desarrollo: tipos, marcas, colecciones, ítems con
 * imágenes de muestra (SVG generados en public/catalogo) y usuarios demo
 * con inventario para probar búsquedas y coincidencias.
 *
 *   npm run db:seed
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as s from "../src/db/schema.ts";
import { hashPassword } from "./password.mts";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client, { schema: s });

const PALETTE = ["#e4572e", "#2f6fd6", "#1f8a5b", "#9b5de5", "#f2a541", "#00a6a6"];

function card(title: string, code: string, color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">
<rect width="300" height="400" rx="18" fill="${color}"/>
<rect x="16" y="16" width="268" height="368" rx="12" fill="#fff" fill-opacity=".15"/>
<text x="150" y="190" font-family="sans-serif" font-size="96" font-weight="700" fill="#fff" text-anchor="middle">${code}</text>
<text x="150" y="250" font-family="sans-serif" font-size="22" fill="#fff" text-anchor="middle">${title}</text>
</svg>`;
}

function writeImage(key: string, svg: string) {
  const path = `public/catalogo/${key}`;
  mkdirSync(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  writeFileSync(path, svg);
}

const CATALOG = [
  {
    type: "Figuritas",
    brand: "Panini",
    name: "Fútbol Mundial",
    year: 2026,
    items: Array.from({ length: 24 }, (_, i) => [String(i + 1), i === 0 ? "Escudo" : `Jugador ${i + 1}`]),
  },
  {
    type: "Figuritas",
    brand: "Panini",
    name: "Copa Continental",
    year: 2024,
    items: Array.from({ length: 16 }, (_, i) => [String(i + 1), `Jugador ${i + 1}`]),
  },
  {
    type: "Cartas",
    brand: "Konami",
    name: "Duelo Legendario",
    year: 2002,
    items: Array.from({ length: 12 }, (_, i) => [
      `LDA-${String(i + 1).padStart(3, "0")}`,
      ["Dragón Blanco", "Mago Oscuro", "Guerrero Celta", "Kuriboh"][i % 4] + ` ${i + 1}`,
    ]),
  },
  {
    type: "Cartas",
    brand: "Topps",
    name: "Estrellas del Básquet",
    year: 2023,
    items: Array.from({ length: 10 }, (_, i) => [String(i + 1), `Base ${i + 1}`]),
  },
] as const;

const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const typeIds = new Map<string, number>();
const brandIds = new Map<string, number>();
const allItemIds: number[] = [];

for (const [ci, c] of CATALOG.entries()) {
  if (!typeIds.has(c.type)) {
    const [t] = await db
      .insert(s.itemTypes)
      .values({ name: c.type, slug: slugify(c.type) })
      .onConflictDoUpdate({ target: s.itemTypes.slug, set: { name: c.type } })
      .returning();
    typeIds.set(c.type, t.id);
  }
  if (!brandIds.has(c.brand)) {
    const [b] = await db
      .insert(s.brands)
      .values({ name: c.brand, slug: slugify(c.brand) })
      .onConflictDoUpdate({ target: s.brands.slug, set: { name: c.brand } })
      .returning();
    brandIds.set(c.brand, b.id);
  }
  const slug = `${slugify(c.brand)}-${slugify(c.name)}-${c.year}`;
  const color = PALETTE[ci % PALETTE.length];
  writeImage(`${slug}/portada.svg`, card(c.name, String(c.year), color));
  const [col] = await db
    .insert(s.collections)
    .values({
      slug,
      name: c.name,
      typeId: typeIds.get(c.type)!,
      brandId: brandIds.get(c.brand)!,
      year: c.year,
      totalItems: c.items.length,
      coverImageKey: `${slug}/portada.svg`,
    })
    .onConflictDoUpdate({ target: s.collections.slug, set: { name: c.name } })
    .returning();

  for (const [i, [code, name]] of c.items.entries()) {
    const imageKey = `${slug}/${slugify(code)}.svg`;
    writeImage(imageKey, card(name, code, color));
    const [it] = await db
      .insert(s.items)
      .values({ collectionId: col.id, code, name, imageKey, sortOrder: i })
      .onConflictDoUpdate({
        target: [s.items.collectionId, s.items.code, s.items.variant],
        set: { name, imageKey },
      })
      .returning();
    allItemIds.push(it.id);
  }
}

// Usuarios demo (contraseña: demo1234). El primero es admin.
const DEMO = [
  { displayName: "Admin", email: "admin@demo.com", city: "CABA", role: "admin" as const },
  { displayName: "Lucía", email: "lucia@demo.com", city: "Rosario", role: "user" as const },
  { displayName: "Martín", email: "martin@demo.com", city: "Córdoba", role: "user" as const },
];
const passwordHash = await hashPassword("demo1234");
const userIds: number[] = [];
for (const u of DEMO) {
  const [row] = await db
    .insert(s.users)
    .values({ ...u, passwordHash })
    .onConflictDoUpdate({ target: s.users.email, set: { displayName: u.displayName } })
    .returning();
  userIds.push(row.id);
}

await db
  .insert(s.contactMethods)
  .values([
    { userId: userIds[1], kind: "whatsapp", value: "+54 9 341 555-0101" },
    { userId: userIds[2], kind: "instagram", value: "@martin.figus" },
  ])
  .onConflictDoNothing();

// Inventario cruzado para que existan coincidencias.
const inv: (typeof s.userItems.$inferInsert)[] = [];
allItemIds.forEach((itemId, i) => {
  if (i % 3 === 0) inv.push({ userId: userIds[1], itemId, list: "tengo", intent: "intercambio" });
  if (i % 4 === 1) inv.push({ userId: userIds[1], itemId, list: "busco" });
  if (i % 4 === 1) inv.push({ userId: userIds[2], itemId, list: "tengo", intent: "ambos", price: 500 });
  if (i % 3 === 0 && i % 2 === 0) inv.push({ userId: userIds[2], itemId, list: "busco" });
});
await db.insert(s.userItems).values(inv).onConflictDoNothing();

console.log(
  `Seed listo: ${allItemIds.length} ítems, ${userIds.length} usuarios (pass: demo1234)`,
);
client.close();
