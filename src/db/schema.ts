import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
};

/* ───────────────────────── Catálogo ─────────────────────────
 * Jerarquía: tipo de artículo → marca → colección (con año) → ítem.
 * Las imágenes las administra el sitio: cada ítem guarda la clave
 * del archivo (p.ej. "panini/mundial-2026/arg-12.webp") y la URL
 * final se arma con NEXT_PUBLIC_IMAGES_BASE_URL (ver src/lib/images.ts).
 */

export const itemTypes = sqliteTable("item_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const brands = sqliteTable("brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const collections = sqliteTable(
  "collections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    typeId: integer("type_id")
      .notNull()
      .references(() => itemTypes.id),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brands.id),
    year: integer("year").notNull(),
    totalItems: integer("total_items"),
    coverImageKey: text("cover_image_key"),
    ...timestamps,
  },
  (t) => [
    index("collections_type_brand_year_idx").on(t.typeId, t.brandId, t.year),
  ],
);

export const items = sqliteTable(
  "items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collections.id),
    /** Número o código impreso: "12", "ARG 5", "LOB-001". */
    code: text("code").notNull(),
    name: text("name").notNull(),
    /** Sección dentro de la colección: selección, equipo, "Estadios"… */
    section: text("section"),
    /** Variante: normal, brillante, holográfica, edición especial… */
    variant: text("variant").notNull().default("normal"),
    rarity: text("rarity"),
    imageKey: text("image_key"),
    /** Orden dentro del álbum/colección. */
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    uniqueIndex("items_collection_code_variant_uq").on(
      t.collectionId,
      t.code,
      t.variant,
    ),
    index("items_collection_sort_idx").on(t.collectionId, t.sortOrder),
    index("items_name_idx").on(t.name),
    index("items_collection_section_idx").on(t.collectionId, t.section),
  ],
);

/* ───────────────────────── Usuarios ───────────────────────── */

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  city: text("city"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  ...timestamps,
});

export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 del token que viaja en la cookie (nunca el token en claro). */
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const CONTACT_KINDS = [
  "whatsapp",
  "telefono",
  "email",
  "instagram",
  "telegram",
  "otro",
] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

/** Medios de contacto: solo se muestran a usuarios registrados. */
export const contactMethods = sqliteTable(
  "contact_methods",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: CONTACT_KINDS }).notNull(),
    value: text("value").notNull(),
  },
  (t) => [index("contact_methods_user_idx").on(t.userId)],
);

/* ───────────────────────── Inventario ─────────────────────────
 * Una fila por (usuario, ítem, lista). lista = "tengo" | "busco".
 * Con esto se responde "¿quién tiene X?" y "¿quién busca X?" con un
 * índice sobre (item_id, list), y se calculan coincidencias.
 */

export const LISTS = ["tengo", "busco"] as const;
export type List = (typeof LISTS)[number];

export const INTENTS = ["venta", "intercambio", "ambos"] as const;
export type Intent = (typeof INTENTS)[number];

export const userItems = sqliteTable(
  "user_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id),
    list: text("list", { enum: LISTS }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    /** Solo para "tengo": si lo vende, lo cambia o ambas. */
    intent: text("intent", { enum: INTENTS }).notNull().default("ambos"),
    /** Precio de referencia en pesos (opcional). */
    price: integer("price"),
    condition: text("condition"),
    notes: text("notes"),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex("user_items_user_item_list_uq").on(t.userId, t.itemId, t.list),
    index("user_items_item_list_idx").on(t.itemId, t.list),
  ],
);

/* ───────────────────────── Mensajes ─────────────────────────
 * Chat interno guardado en la base (sin servicios pagos): cada
 * conversación es un grupo con miembros; un chat 1 a 1 es un grupo
 * de dos con is_direct = 1. El cliente consulta mensajes nuevos cada
 * pocos segundos mientras la pantalla está abierta.
 */

export const conversations = sqliteTable(
  "conversations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Nombre del grupo; null en los chats directos. */
    name: text("name"),
    isDirect: integer("is_direct", { mode: "boolean" }).notNull().default(false),
    /** Para directos: "idMenor:idMayor", evita duplicados. */
    directKey: text("direct_key").unique(),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),
    lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
    ...timestamps,
  },
);

export const conversationMembers = sqliteTable(
  "conversation_members",
  {
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Último mensaje leído (id), para contar no leídos. */
    lastReadId: integer("last_read_id").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("conversation_members_conv_user_uq").on(t.conversationId, t.userId),
    index("conversation_members_user_idx").on(t.userId),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    ...timestamps,
  },
  (t) => [index("messages_conv_id_idx").on(t.conversationId, t.id)],
);
