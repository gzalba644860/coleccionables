import "server-only";
import { headers } from "next/headers";

/** Origen público del sitio (https://dominio), tomado del pedido actual. */
export async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

type Entry = { code: string; collectionName: string };

const MAX_CODES = 120;

/** Códigos agrupados por colección: "Mundial 2026: ARG1, ARG5, BRA3". */
function summarize(list: Entry[]) {
  const byCollection = new Map<string, string[]>();
  for (const i of list.slice(0, MAX_CODES)) {
    const codes = byCollection.get(i.collectionName) ?? [];
    codes.push(i.code);
    byCollection.set(i.collectionName, codes);
  }
  const lines = [...byCollection].map(([name, codes]) => `${name}: ${codes.join(", ")}`);
  if (list.length > MAX_CODES) lines.push(`…y ${list.length - MAX_CODES} más`);
  return lines.join("\n");
}

/** Mensaje listo para WhatsApp con lo que ofrece y lo que busca. */
export function buildShareText(have: Entry[], want: Entry[], url: string) {
  const parts = ["Mi lista de figuritas en Coleccionables"];
  if (have.length) parts.push(`*Ofrezco (${have.length})*\n${summarize(have)}`);
  if (want.length) parts.push(`*Busco (${want.length})*\n${summarize(want)}`);
  parts.push(`Mirá la lista completa y escribime: ${url}`);
  return parts.join("\n\n");
}
