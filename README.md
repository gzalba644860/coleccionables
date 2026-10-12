# Coleccionables

Portal para comprar, vender e intercambiar coleccionables (figuritas, cartas).
Mobile-first, pensado para ~1000 usuarios con costo $0.

## Cómo funciona

1. **Catálogo** jerárquico administrado por el sitio: tipo → marca → colección (año) → ítem, cada ítem con su imagen.
2. El usuario filtra en cascada (tipo, marca, año, colección, número/nombre) y ve la foto del ítem.
3. Marca cada ítem como **Lo tengo** (con cantidad de repetidas, venta/intercambio, precio y nota) o **Lo busco**.
4. Cada ítem muestra **quién lo tiene** y **quién lo busca**; cada perfil muestra qué ofrece y qué busca.
5. **Coincidencias**: quién tiene lo que buscás, ordenado primero por intercambio mutuo.
6. Los **medios de contacto** (WhatsApp, teléfono, email, Instagram, Telegram, otro) solo los ven usuarios registrados. Las fotos reales se comparten por fuera del sitio.

## Stack

| Capa | Elección | Por qué |
| --- | --- | --- |
| Web | Next.js 16 (App Router, Server Components, Server Actions, Cache Components) + TypeScript | SSR rápido en celular, sin API separada |
| Estilos | Tailwind CSS 4 | Mobile-first, sin dependencias de UI |
| Base de datos | Turso (libSQL/SQLite) + Drizzle ORM | Plan gratuito holgado (GBs de almacenamiento y cientos de millones de lecturas al mes) |
| Imágenes | Cloudflare R2 + dominio público | 10 GB gratis y sin costo de transferencia |
| Hosting | Vercel Hobby | Gratis, deploy automático desde GitHub |
| Auth | Email + contraseña (scrypt), sesiones en la base con cookie httpOnly | Sin servicios externos |

El catálogo se cachea (`"use cache"` + `cacheTag("catalog")`) y se invalida cuando el admin lo modifica, lo que ahorra lecturas en Turso.

## Modelo de datos (`src/db/schema.ts`)

- `item_types`, `brands`: tipos de artículo y marcas.
- `collections`: tipo + marca + año, total de ítems, portada.
- `items`: código impreso, nombre, variante (normal/brillante…), rareza, `image_key`. Único por (colección, código, variante).
- `users`, `sessions`, `contact_methods`.
- `user_items`: una fila por (usuario, ítem, lista `tengo|busco`) con cantidad, intención (venta/intercambio/ambos), precio y notas. Índice `(item_id, list)` para "¿quién lo tiene?".

## Desarrollo local

```bash
npm install
npm run db:migrate   # crea local.db
npm run db:seed      # catálogo de ejemplo + usuarios demo (pass: demo1234)
npm run dev
```

Usuarios demo: `admin@demo.com` (admin), `lucia@demo.com`, `martin@demo.com`.
En una base vacía, **el primer usuario que se registra queda como admin**.

## Carga del catálogo

En `/admin` (solo admin): crear tipos, marcas, colecciones y cargar ítems en bloque
pegando líneas `codigo;nombre;variante;clave_imagen`. Si se omite la clave de imagen se usa
`<slug-colección>/<código>.webp`, así que alcanza con subir las imágenes al bucket con ese nombre.

## Imágenes de las figuritas

Las imágenes viven en `public/catalogo/<slug-colección>/<código>.webp` (por ejemplo
`public/catalogo/panini-mundial-2026/arg10.webp`), webp de 400 px de ancho, unos 25 KB cada una.
`npm run catalog:mundiales` vincula automáticamente cada figurita con su archivo si existe.

- **Mundial 2026**: las 980 cargadas.
- **Rusia 2018 y Qatar 2022**: todavía sin imagen; se muestra la ficha propia. Para sumarlas basta con
  copiar los `.webp` con ese nombre en su carpeta y volver a correr `npm run catalog:mundiales`.

Mientras tanto Vercel las sirve desde `/public`. Para pasarlas a Cloudflare R2 se sube la carpeta
tal cual (por ejemplo `rclone copy public/catalogo r2:<bucket>`) y se define
`NEXT_PUBLIC_IMAGES_BASE_URL` con la URL pública del bucket; las claves no cambian.

## Deploy gratis

1. **Turso**: `turso db create coleccionables`, luego `turso db show coleccionables --url` y `turso db tokens create coleccionables`.
2. Aplicar migraciones contra Turso: `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:migrate`.
3. **Cloudflare R2**: crear bucket, habilitar acceso público (dominio r2.dev o propio) y subir las imágenes.
4. **Vercel**: importar el repo y configurar las variables de `.env.example`.

Cambios de esquema: editar `src/db/schema.ts`, `npm run db:generate`, `npm run db:migrate`.

## Próximos pasos sugeridos

- Subida de imágenes a R2 desde `/admin` y edición/borrado de ítems.
- Verificación de email y recuperación de contraseña.
- Rate limiting en login/registro.
- Búsqueda full-text (FTS5) si el catálogo supera ~100k ítems.
- Reputación/calificaciones entre usuarios.
