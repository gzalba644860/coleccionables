import Link from "next/link";
import { Suspense } from "react";
import { updateDetails } from "@/app/actions/inventory";
import { GridSkeleton, ItemCard, ItemGrid } from "@/components/item-card";
import { INTENTS } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ItemImage } from "@/components/item-image";
import { getUserList } from "@/lib/inventory";
import { ListTabs } from "@/components/list-tabs";
import { ShareList } from "@/components/share-list";
import { buildShareText, siteOrigin } from "@/lib/share";

export default function MyCollectionPage({ searchParams }: PageProps<"/mi-cuenta">) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <MyCollection searchParams={searchParams} />
    </Suspense>
  );
}

const INTENT_LABEL = { venta: "Venta", intercambio: "Intercambio", ambos: "Ambos" };

async function MyCollection({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const initial = (await searchParams).lista === "busco" ? "busco" : "tengo";
  const [have, want] = await Promise.all([
    getUserList(user.id, "tengo"),
    getUserList(user.id, "busco"),
  ]);
  const profileUrl = `${await siteOrigin()}/usuario/${user.id}`;

  return (
    <div className="grid gap-5">
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

      {have.length + want.length > 0 && (
        <ShareList text={buildShareText(have, want, profileUrl)} url={profileUrl} />
      )}

      <ListTabs
        initial={initial}
        haveCount={have.length}
        wantCount={want.length}
        have={have.length === 0 ? (
          <Empty />
        ) : (
          <ul className="grid gap-2">
            {have.map((i) => (
              <li key={i.rowId} className="card flex gap-3 p-2">
                <Link href={`/item/${i.itemId}`} className="w-16 shrink-0">
                  <ItemImage code={i.code} name={i.name} section={i.section} imageKey={i.imageKey} className="rounded" compact />
                </Link>
                <div className="grid flex-1 gap-2">
                  <p className="text-sm">
                    <b>{i.code}</b> {i.name}{" "}
                    <span className="text-muted">
                      · {i.section ? `${i.section} · ` : ""}{i.collectionName} · x{i.quantity}
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
        want={want.length === 0 ? (
          <Empty />
        ) : (
          <ItemGrid>
            {want.map((i) => (
              <ItemCard
                key={i.rowId}
                item={{ id: i.itemId, code: i.code, name: i.name, section: i.section, imageKey: i.imageKey, subtitle: i.collectionName }}
                status={{ busco: true }}
                loggedIn
              />
            ))}
          </ItemGrid>
        )}
      />
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
