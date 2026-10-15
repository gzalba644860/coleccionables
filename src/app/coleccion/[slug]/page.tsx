import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GridSkeleton, ItemCard, ItemGrid } from "@/components/item-card";
import { getCurrentUser } from "@/lib/auth";
import { getCollectionBySlug, getCollectionItems } from "@/lib/catalog";
import { getStatusForItems } from "@/lib/inventory";

const anchor = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Vista "álbum": todos los ítems de la colección para marcar tengo/busco. */
export default function CollectionPage({ params }: PageProps<"/coleccion/[slug]">) {
  return (
    <Suspense fallback={<GridSkeleton n={15} />}>
      <Album params={params} />
    </Suspense>
  );
}

async function Album({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const [list, user] = await Promise.all([
    getCollectionItems(collection.id),
    getCurrentUser(),
  ]);
  const status = user ? await getStatusForItems(user.id, list.map((i) => i.id)) : {};
  const have = Object.values(status).filter((s) => s.tengo).length;
  const total = collection.totalItems ?? list.length;

  // Agrupa por sección (selección) manteniendo el orden del álbum.
  const bySection = new Map<string, typeof list>();
  for (const item of list) {
    const key = item.section ?? "Otros";
    bySection.set(key, [...(bySection.get(key) ?? []), item]);
  }
  const sections = [...bySection.entries()];

  return (
    <div className="grid gap-6">
      <header className="card relative overflow-hidden p-5 sm:p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-8 text-[8rem] font-black leading-none tracking-tighter text-accent/10"
        >
          {collection.year}
        </span>
        <div className="relative grid gap-4">
          <div>
            <p className="eyebrow">
              {collection.typeName} · {collection.brandName} · {collection.year}
            </p>
            <h1 className="page-title mt-1">{collection.name}</h1>
            <p className="mt-1 text-sm text-muted">{total.toLocaleString("es-AR")} figuritas</p>
          </div>
          {user && total > 0 && (
            <div className="grid gap-2">
              <div className="flex items-baseline justify-between text-sm">
                <p>
                  Tenés <b className="text-have">{have}</b> de {total}
                </p>
                <p className="font-bold tabular-nums">{Math.round((have / total) * 100)}%</p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-have to-[#35c48a]"
                  style={{ width: `${(have / total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted">Te faltan {total - have}.</p>
            </div>
          )}
        </div>
      </header>
      {list.length === 0 ? (
        <p className="text-muted">Esta colección todavía no tiene ítems cargados.</p>
      ) : (
        <>
          {sections.length > 1 && (
            <nav className="sticky top-14 z-10 -mx-4 flex gap-2 overflow-x-auto border-b border-border/60 bg-background/85 px-4 py-2.5 backdrop-blur-xl [scrollbar-width:none]">
              {sections.map(([name, group]) => {
                const got = group.filter((i) => status[i.id]?.tengo).length;
                const done = user && got === group.length;
                return (
                  <a
                    key={name}
                    href={`#${anchor(name)}`}
                    className={`chip ${done ? "!border-have/40 !bg-have-soft text-have" : ""}`}
                  >
                    {name}
                    {user && (
                      <span className="text-xs font-semibold tabular-nums text-muted">
                        {done ? "✓" : `${got}/${group.length}`}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>
          )}
          {sections.map(([name, group]) => (
            <section key={name} id={anchor(name)} className="grid scroll-mt-32 gap-3">
              {sections.length > 1 && (
                <h2 className="flex items-baseline gap-2 text-lg font-bold">
                  {name}
                  <span className="text-sm font-medium tabular-nums text-muted">
                    {user
                      ? `${group.filter((i) => status[i.id]?.tengo).length} de ${group.length}`
                      : group.length}
                  </span>
                </h2>
              )}
              <ItemGrid>
                {group.map((item) => (
                  <ItemCard key={item.id} item={item} status={status[item.id]} loggedIn={!!user} />
                ))}
              </ItemGrid>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
