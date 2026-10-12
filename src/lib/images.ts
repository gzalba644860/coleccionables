/**
 * Las imágenes del catálogo las administra el sitio (los usuarios no suben
 * fotos). En producción se recomienda Cloudflare R2 (10 GB gratis, sin costo
 * de salida) con un dominio público; en desarrollo se sirven desde /public.
 *
 * Convención de claves: "<slug-coleccion>/<codigo-slug>.webp"
 * (p. ej. "panini-mundial-2026/arg10.webp"), igual en public/catalogo y en R2.
 */
const BASE = (process.env.NEXT_PUBLIC_IMAGES_BASE_URL ?? "/catalogo").replace(
  /\/$/,
  "",
);

export function imageUrl(key: string | null | undefined) {
  if (!key) return "/placeholder.svg";
  if (/^https?:\/\//.test(key)) return key;
  return `${BASE}/${key.replace(/^\//, "")}`;
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
