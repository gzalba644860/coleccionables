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
    <div className="grid gap-5">
      <div>
        <p className="text-sm text-muted">
          {collection.typeName} · {collection.brandName} · {collection.year}
        </p>
        <h1 className="text-2xl font-bold">{collection.name}</h1>
        {user && total > 0 && (
          <div className="mt-3 grid gap-1">
            <p className="text-sm">
              Tenés <b>{have}</b> de {total} ({Math.round((have / total) * 100)}%)
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div className="h-full bg-have" style={{ width: `${(have / total) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
      {list.length === 0 ? (
        <p className="text-muted">Esta colección todavía no tiene ítems cargados.</p>
      ) : (
        <>
          {sections.length > 1 && (
            <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 text-sm">
              {sections.map(([name]) => (
                <a
                  key={name}
                  href={`#${anchor(name)}`}
                  className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5"
                >
                  {name}
                </a>
              ))}
            </nav>
          )}
          {sections.map(([name, group]) => (
            <section key={name} id={anchor(name)} className="grid scroll-mt-20 gap-3">
              {sections.length > 1 && <h2 className="text-lg font-semibold">{name}</h2>}
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
