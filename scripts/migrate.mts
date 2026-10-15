import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
console.log("Migraciones aplicadas");

// ADMIN_EMAIL (secreto, separado por comas): esas cuentas quedan admin y aprobadas.
const admins = (process.env.ADMIN_EMAIL ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
if (admins.length) {
  const res = await client.execute({
    sql: `UPDATE users SET role = 'admin', status = 'approved'
          WHERE lower(email) IN (${admins.map(() => "?").join(",")})`,
    args: admins,
  });
  console.log(`Administradores por ADMIN_EMAIL: ${res.rowsAffected} cuenta(s) actualizada(s)`);
}
client.close();
