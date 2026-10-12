/**
 * Importa una colección desde un CSV (codigo,nombre,seleccion,orden).
 *
 *   npm run catalog:import -- data/catalogo/panini-mundial-2022.csv \
 *     --type "Figuritas" --brand "Panini" --name "Mundial Qatar 2022" --year 2022
 *
 * Es idempotente: vuelve a correrse para corregir nombres o agregar ítems.
 * No borra ítems que ya no estén en el CSV (podrían tener inventario).
 */
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as s from "../src/db/schema.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    type: { type: "string" },
    brand: { type: "string" },
    name: { type: "string" },
    year: { type: "string" },
    total: { type: "string" },
  },
});
const [file] = positionals;
if (!file || !values.type || !values.brand || !values.name || !values.year) {
  console.error("Uso: import-catalog <csv> --type T --brand B --name N --year A");
  process.exit(1);
}

const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** CSV simple con comillas dobles (RFC 4180). */
function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") endCell();
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else cell += ch;
  }
  if (cell || row.length) endRow();
  return rows.filter((r) => r.some(Boolean));
}

const [header, ...data] = parseCsv(readFileSync(file, "utf8"));
const col = (n: string) => header.indexOf(n);
const [iCode, iName, iSection, iOrder] = ["codigo", "nombre", "seleccion", "orden"].map(col);
if (iCode < 0 || iName < 0) throw new Error("El CSV necesita columnas codigo y nombre");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client, { schema: s });

const upsertNamed = async (table: typeof s.itemTypes | typeof s.brands, name: string) => {
  const [row] = await db
    .insert(table)
    .values({ name, slug: slugify(name) })
    .onConflictDoUpdate({ target: table.slug, set: { name } })
    .returning();
  return row.id;
};

const typeId = await upsertNamed(s.itemTypes, values.type);
const brandId = await upsertNamed(s.brands, values.brand);
const year = Number(values.year);
const slug = `${slugify(values.brand)}-${slugify(values.name)}`;
const [collection] = await db
  .insert(s.collections)
  .values({ slug, name: values.name, typeId, brandId, year, totalItems: data.length })
  .onConflictDoUpdate({
    target: s.collections.slug,
    set: { name: values.name, typeId, brandId, year, totalItems: data.length },
  })
  .returning();

const items = data.map((r, i) => ({
  collectionId: collection.id,
  code: r[iCode].trim(),
  name: r[iName].trim(),
  section: iSection >= 0 ? r[iSection].trim() || null : null,
  sortOrder: iOrder >= 0 ? Number(r[iOrder]) : i,
}));

for (let i = 0; i < items.length; i += 200) {
  await db
    .insert(s.items)
    .values(items.slice(i, i + 200))
    .onConflictDoUpdate({
      target: [s.items.collectionId, s.items.code, s.items.variant],
      set: {
        name: sql`excluded.name`,
        section: sql`excluded.section`,
        sortOrder: sql`excluded.sort_order`,
      },
    });
}
console.log(`${values.name}: ${items.length} ítems (colección ${slug})`);
client.close();
