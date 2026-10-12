import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ItemActions } from "@/components/item-actions";
import { getCurrentUser } from "@/lib/auth";
import { getItem } from "@/lib/catalog";
import { ItemImage } from "@/components/item-image";
import { getStatusForItems, getUsersForItem } from "@/lib/inventory";

export default function ItemPage({ params }: PageProps<"/item/[id]">) {
  return (
    <Suspense fallback={<div className="card h-96 animate-pulse" />}>
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
    <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
      <div className="grid gap-3 self-start">
        <div className="card overflow-hidden">
          <ItemImage code={item.code} name={item.name} section={item.section} imageKey={item.imageKey} />
        </div>
        <ItemActions itemId={id} tengo={status?.tengo} busco={status?.busco} loggedIn={!!user} />
      </div>

      <div className="grid content-start gap-6">
        <div>
          <p className="text-sm text-muted">
            {item.typeName} · {item.brandName} ·{" "}
            <Link href={`/coleccion/${item.collectionSlug}`} className="underline">
              {item.collectionName}
            </Link>{" "}
            · {item.year}
          </p>
          <h1 className="text-2xl font-bold">
            #{item.code} {item.name}
          </h1>
          {item.section && <p className="text-muted">{item.section}</p>}
          {item.variant !== "normal" && <p className="text-accent">{item.variant}</p>}
        </div>

        <section className="grid gap-2">
          <h2 className="font-semibold text-have">Lo tienen ({holders.length})</h2>
          {holders.length === 0 ? (
            <p className="text-sm text-muted">Nadie lo ofrece por ahora.</p>
          ) : (
            <ul className="card divide-y divide-border">
              {holders.map((h) => (
                <li key={h.userId} className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <Link href={`/usuario/${h.userId}`} className="font-medium underline">
                      {h.displayName}
                    </Link>
                    <p className="text-xs text-muted">
                      {[h.city, INTENT[h.intent], h.quantity > 1 && `x${h.quantity}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {h.notes && <p className="text-xs">{h.notes}</p>}
                  </div>
                  {h.price != null && (
                    <span className="whitespace-nowrap font-semibold">
                      ${h.price.toLocaleString("es-AR")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid gap-2">
          <h2 className="font-semibold text-want">Lo buscan ({seekers.length})</h2>
          {seekers.length === 0 ? (
            <p className="text-sm text-muted">Nadie lo está buscando.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {seekers.map((s) => (
                <li key={s.userId}>
                  <Link
                    href={`/usuario/${s.userId}`}
                    className="inline-block rounded-full border border-border bg-card px-3 py-1 text-sm"
                  >
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
