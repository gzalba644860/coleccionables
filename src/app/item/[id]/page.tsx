import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { ItemActions } from "@/components/item-actions";
import { getCurrentUser } from "@/lib/auth";
import { getItem } from "@/lib/catalog";
import { ItemImage } from "@/components/item-image";
import { getStatusForItems, getUsersForItem } from "@/lib/inventory";

export default function ItemPage({ params }: PageProps<"/item/[id]">) {
  return (
    <Suspense fallback={<div className="card h-96 animate-pulse bg-subtle" />}>
      <ItemDetail params={params} />
    </Suspense>
  );
}

const INTENT: Record<string, string> = {
  venta: "Venta",
  intercambio: "Intercambio",
  ambos: "Venta o intercambio",
};

async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const item = await getItem(id);
  if (!item) notFound();

  const [holders, seekers, user] = await Promise.all([
    getUsersForItem(id, "tengo"),
    getUsersForItem(id, "busco"),
    getCurrentUser(),
  ]);
  const status = user ? (await getStatusForItems(user.id, [id]))[id] : undefined;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,340px)_1fr] md:gap-10">
      <div className="grid gap-3 self-start md:sticky md:top-20">
        <div className="card mx-auto w-full max-w-[300px] p-3 md:max-w-none">
          <ItemImage
            code={item.code}
            name={item.name}
            section={item.section}
            imageKey={item.imageKey}
            className="rounded-xl"
          />
        </div>
        <ItemActions itemId={id} tengo={status?.tengo} busco={status?.busco} loggedIn={!!user} />
      </div>

      <div className="grid content-start gap-8">
        <div className="grid gap-2">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
            <span>{item.typeName}</span>
            <span aria-hidden>›</span>
            <span>{item.brandName}</span>
            <span aria-hidden>›</span>
            <Link href={`/coleccion/${item.collectionSlug}`} className="link">
              {item.collectionName}
            </Link>
          </nav>
          <h1 className="page-title">
            <span className="text-muted">#{item.code}</span> {item.name}
          </h1>
          <div className="flex flex-wrap gap-2">
            {item.section && <span className="chip !shadow-none">{item.section}</span>}
            {item.variant !== "normal" && (
              <span className="chip !border-accent/30 !bg-accent-soft !shadow-none text-accent">
                ✦ {item.variant}
              </span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-have-soft p-4">
              <p className="text-2xl font-extrabold tabular-nums text-have">{holders.length}</p>
              <p className="text-sm font-medium text-have">la ofrecen</p>
            </div>
            <div className="rounded-2xl bg-want-soft p-4">
              <p className="text-2xl font-extrabold tabular-nums text-want">{seekers.length}</p>
              <p className="text-sm font-medium text-want">la buscan</p>
            </div>
          </div>
        </div>

        <section className="grid gap-3">
          <h2 className="text-lg font-bold">Quién la tiene</h2>
          {holders.length === 0 ? (
            <p className="card p-4 text-sm text-muted">Nadie la ofrece por ahora.</p>
          ) : (
            <ul className="card divide-y divide-border overflow-hidden">
              {holders.map((h) => (
                <li key={h.userId}>
                  <Link
                    href={`/usuario/${h.userId}`}
                    className="flex items-center gap-3 p-3.5 transition hover:bg-subtle"
                  >
                    <Avatar
                      user={{ id: h.userId, displayName: h.displayName, avatarVersion: h.avatarVersion }}
                      size={40}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{h.displayName}</p>
                      <p className="truncate text-xs text-muted">
                        {[h.city, INTENT[h.intent], h.quantity > 1 && `x${h.quantity}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {h.notes && <p className="truncate text-xs">{h.notes}</p>}
                    </div>
                    {h.price != null && (
                      <span className="whitespace-nowrap rounded-full bg-subtle px-3 py-1 text-sm font-bold">
                        ${h.price.toLocaleString("es-AR")}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid gap-3">
          <h2 className="text-lg font-bold">Quién la busca</h2>
          {seekers.length === 0 ? (
            <p className="card p-4 text-sm text-muted">Nadie la está buscando.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {seekers.map((s) => (
                <li key={s.userId}>
                  <Link href={`/usuario/${s.userId}`} className="chip !py-1 !pl-1">
                    <Avatar
                      user={{ id: s.userId, displayName: s.displayName, avatarVersion: s.avatarVersion }}
                      size={24}
                    />
                    {s.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
