import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { imageUrl } from "@/lib/images";
import { getMatches } from "@/lib/inventory";

export default function MatchesPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Coincidencias</h1>
      <p className="text-sm text-muted">
        Usuarios que tienen lo que buscás. Primero los que además buscan algo que vos tenés:
        ahí hay intercambio posible.
      </p>
      <Suspense fallback={<div className="card h-40 animate-pulse" />}>
        <Matches />
      </Suspense>
    </div>
  );
}

async function Matches() {
  const user = await requireUser();
  const groups = await getMatches(user.id);
  if (!groups.length) {
    return (
      <p className="text-sm text-muted">
        Todavía no hay coincidencias. Marcá más ítems como &quot;Lo busco&quot; para encontrar
        quién los tiene.
      </p>
    );
  }
  return (
    <ul className="grid gap-3">
      {groups.map((g) => (
        <li key={g.otherId} className="card grid gap-3 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Link href={`/usuario/${g.otherId}`} className="font-semibold underline">
                {g.otherName}
              </Link>
              {g.city && <span className="text-sm text-muted"> · {g.city}</span>}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                g.canGive ? "bg-have text-white" : "bg-border"
              }`}
            >
              Tiene {g.items.length} que buscás
              {g.canGive ? ` · busca ${g.canGive} que tenés` : ""}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {g.items.map((i) => (
              <Link key={i.itemId} href={`/item/${i.itemId}`} className="w-20 shrink-0 text-center">
                <img
                  src={imageUrl(i.imageKey)}
                  alt={i.name}
                  loading="lazy"
                  className="aspect-[3/4] w-full rounded bg-background object-contain"
                />
                <span className="text-xs">#{i.code}</span>
              </Link>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
