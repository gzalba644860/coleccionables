import Link from "next/link";
import { Suspense } from "react";
import { openDirect } from "@/app/actions/messages";
import { requireUser } from "@/lib/auth";
import { ItemImage } from "@/components/item-image";
import { getMatches } from "@/lib/inventory";

export default function MatchesPage() {
  return (
    <div className="grid gap-4">
      <h1 className="page-title">Coincidencias</h1>
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
        <li key={g.otherId} className={`card grid gap-3 p-4 ${g.canGive ? "!border-have/40" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Link href={`/usuario/${g.otherId}`} className="font-bold hover:text-accent">
                {g.otherName}
              </Link>
              {g.city && <span className="text-sm text-muted"> · {g.city}</span>}
            </div>
            <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                g.canGive ? "bg-have-soft text-have" : "bg-subtle text-muted"
              }`}
            >
              Tiene {g.items.length} que buscás
              {g.canGive ? ` · busca ${g.canGive} que tenés` : ""}
            </span>
            <form action={openDirect.bind(null, g.otherId)}>
              <button className="btn-primary !px-3 !py-1.5 text-xs">Mensaje</button>
            </form>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {g.items.map((i) => (
              <Link key={i.itemId} href={`/item/${i.itemId}`} className="grid w-20 shrink-0 gap-1 text-center">
                <ItemImage code={i.code} name={i.name} section={i.section} imageKey={i.imageKey} className="rounded-lg shadow-soft" compact />
                <span className="line-clamp-1 text-xs font-medium">{i.name}</span>
              </Link>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
