/**
 * Usuarios demo con inventario sobre el catálogo real, para probar
 * búsquedas y coincidencias en desarrollo.
 *
 *   npm run db:seed
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as s from "../src/db/schema.ts";
import { hashPassword } from "./password.mts";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client, { schema: s });

// El catálogo real se carga antes con `npm run catalog:mundiales`.
const allItemIds = (await db.select({ id: s.items.id }).from(s.items)).map((r) => r.id);
if (!allItemIds.length) throw new Error("Catálogo vacío: corré npm run catalog:mundiales");

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

// Inventario cruzado para que existan coincidencias (sobre una muestra).
const inv: (typeof s.userItems.$inferInsert)[] = [];
allItemIds.filter((_, i) => i % 7 === 0).forEach((itemId, i) => {
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
