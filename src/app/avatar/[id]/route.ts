import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db, schema } from "@/db";

/** Sirve la foto de perfil guardada en la base. La URL lleva ?v=<versión>, así que se cachea fuerte. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/avatar/[id]">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return new Response(null, { status: 404 });
  const row = await db
    .select({ avatar: schema.users.avatar })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .get();
  const match = row?.avatar?.match(/^data:(image\/(?:webp|jpeg|png));base64,(.+)$/);
  if (!match) return new Response(null, { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), {
    headers: {
      "content-type": match[1],
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
