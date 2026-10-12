import Link from "next/link";
import { Suspense } from "react";
import { updateDetails } from "@/app/actions/inventory";
import { GridSkeleton, ItemCard, ItemGrid } from "@/components/item-card";
import { INTENTS } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { imageUrl } from "@/lib/images";
import { getUserList } from "@/lib/inventory";

export default function MyCollectionPage() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <MyCollection />
    </Suspense>
  );
}

const INTENT_LABEL = { venta: "Venta", intercambio: "Intercambio", ambos: "Ambos" };

async function MyCollection() {
  const user = await requireUser();
  const [have, want] = await Promise.all([
    getUserList(user.id, "tengo"),
    getUserList(user.id, "busco"),
  ]);

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Hola, {user.displayName}</h1>
        <div className="flex gap-2">
          <Link href={`/usuario/${user.id}`} className="btn-ghost">
            Ver mi perfil público
          </Link>
          <Link href="/buscar" className="btn-primary">
            + Agregar ítems
          </Link>
        </div>
      </div>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-have">Tengo para ofrecer ({have.length})</h2>
        {have.length === 0 ? (
          <Empty />
        ) : (
          <ul className="grid gap-2">
            {have.map((i) => (
              <li key={i.rowId} className="card flex gap-3 p-2">
                <Link href={`/item/${i.itemId}`} className="w-16 shrink-0">
                  <img
                    src={imageUrl(i.imageKey)}
                    alt={i.name}
                    loading="lazy"
                    className="aspect-[3/4] w-full rounded bg-background object-contain"
                  />
                </Link>
                <div className="grid flex-1 gap-2">
                  <p className="text-sm">
                    <b>#{i.code}</b> {i.name}{" "}
                    <span className="text-muted">
                      · {i.collectionName} · x{i.quantity}
                    </span>
                  </p>
                  <form action={updateDetails} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="itemId" value={i.itemId} />
                    <select name="intent" defaultValue={i.intent} className="input !w-auto !py-1.5 text-sm">
                      {INTENTS.map((v) => (
                        <option key={v} value={v}>
                          {INTENT_LABEL[v]}
                        </option>
                      ))}
                    </select>
                    <input
                      name="price"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="Precio $"
                      defaultValue={i.price ?? ""}
                      className="input !w-28 !py-1.5 text-sm"
                    />
                    <input
                      name="notes"
                      placeholder="Nota (estado, etc.)"
                      defaultValue={i.notes ?? ""}
                      maxLength={200}
                      className="input !w-auto flex-1 !py-1.5 text-sm"
                    />
                    <button className="btn-ghost !py-1.5">Guardar</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-want">Busco ({want.length})</h2>
        {want.length === 0 ? (
          <Empty />
        ) : (
          <ItemGrid>
            {want.map((i) => (
              <ItemCard
                key={i.rowId}
                item={{ id: i.itemId, code: i.code, name: i.name, imageKey: i.imageKey, subtitle: i.collectionName }}
                status={{ busco: true }}
                loggedIn
              />
            ))}
          </ItemGrid>
        )}
      </section>
    </div>
  );
}

function Empty() {
  return (
    <p className="text-sm text-muted">
      Nada por acá todavía.{" "}
      <Link href="/buscar" className="text-accent underline">
        Buscá en el catálogo
      </Link>{" "}
      y marcá lo que tenés o buscás.
    </p>
  );
}
