import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogFilters } from "@/components/catalog-filters";
import { GridSkeleton, ItemCard, ItemGrid } from "@/components/item-card";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogTree, searchItems } from "@/lib/catalog";
import { getStatusForItems } from "@/lib/inventory";

export const metadata: Metadata = { title: "Buscar" };

type SP = Record<string, string | string[] | undefined>;

export default async function BuscarPage({ searchParams }: PageProps<"/buscar">) {
  const tree = await getCatalogTree();
  return (
    <div className="grid gap-6">
      <h1 className="page-title">Buscar en el catálogo</h1>
      <Suspense fallback={<GridSkeleton />}>
        <Results tree={tree} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const num = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Results({
  tree,
  searchParams,
}: {
  tree: Awaited<ReturnType<typeof getCatalogTree>>;
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filters = {
    type: num(sp.type),
    brand: num(sp.brand),
    year: num(sp.year),
    collection: num(sp.collection),
    q: str(sp.q)?.slice(0, 60),
  };
  const [results, user] = await Promise.all([searchItems(filters), getCurrentUser()]);
  const status = user ? await getStatusForItems(user.id, results.map((r) => r.id)) : {};

  return (
    <>
      <CatalogFilters
        tree={tree}
        initial={{
          type: str(sp.type),
          brand: str(sp.brand),
          year: str(sp.year),
          collection: str(sp.collection),
          q: filters.q,
        }}
      />
      {results.length === 0 ? (
        <p className="text-muted">No encontramos ítems con esos filtros.</p>
      ) : (
        <ItemGrid>
          {results.map((r) => (
            <ItemCard
              key={r.id}
              item={{ ...r, subtitle: [r.section, r.collectionName].filter(Boolean).join(" · ") }}
              status={status[r.id]}
              loggedIn={!!user}
            />
          ))}
        </ItemGrid>
      )}
    </>
  );
}
