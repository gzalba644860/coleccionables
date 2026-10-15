import Link from "next/link";
import { Suspense } from "react";
import { updateDetails } from "@/app/actions/inventory";
import { GridSkeleton, ItemCard, ItemGrid } from "@/components/item-card";
import { INTENTS } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ItemImage } from "@/components/item-image";
import { getUserList } from "@/lib/inventory";
import { ListTabs } from "@/components/list-tabs";
import { PushToggle } from "@/components/push-toggle";
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
      <PushToggle variant="banner" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Mi colección</p>
          <h1 className="page-title">Hola, {user.displayName}</h1>
        </div>
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
              <li key={i.rowId} className="card flex gap-3 p-3">
                <Link href={`/item/${i.itemId}`} className="w-16 shrink-0">
                  <ItemImage code={i.code} name={i.name} section={i.section} imageKey={i.imageKey} className="rounded-lg" compact />
                </Link>
                <div className="grid min-w-0 flex-1 gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        <span className="font-mono text-xs text-muted">{i.code}</span> {i.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {i.section ? `${i.section} · ` : ""}
                        {i.collectionName}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-have-soft px-2 py-0.5 text-xs font-bold tabular-nums text-have">
                      ×{i.quantity}
                    </span>
                  </div>
                  <details className="group/edit">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs [&::-webkit-details-marker]:hidden">
                      <span className="flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-subtle px-2 py-0.5 font-medium">{INTENT_LABEL[i.intent]}</span>
                        {i.price != null && (
                          <span className="rounded-full bg-subtle px-2 py-0.5 font-semibold">
                            ${i.price.toLocaleString("es-AR")}
                          </span>
                        )}
                        {i.notes && <span className="line-clamp-1 px-1 text-muted">{i.notes}</span>}
                      </span>
                      <span className="shrink-0 font-semibold text-accent group-open/edit:hidden">Editar</span>
                    </summary>
                    <form action={updateDetails} className="mt-2 flex flex-wrap items-center gap-2">
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
                  </details>
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
    <div className="card grid justify-items-center gap-3 px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="4" y="4" width="7" height="9" rx="1.5" />
          <rect x="13" y="4" width="7" height="9" rx="1.5" />
          <path d="M4 17h16M4 20h10" />
        </svg>
      </span>
      <p className="font-semibold">Nada por acá todavía</p>
      <p className="max-w-xs text-sm text-muted">
        Entrá a una colección y marcá lo que tenés o lo que te falta.
      </p>
      <Link href="/" className="btn-primary">
        Ver colecciones
      </Link>
    </div>
  );
}
