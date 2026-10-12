import Link from "next/link";
import { CatalogFilters } from "@/components/catalog-filters";
import { getCatalogTree } from "@/lib/catalog";
import { imageUrl } from "@/lib/images";

export default async function Home() {
  // Catálogo cacheado ("use cache"): entra en el shell estático de la página.
  const tree = await getCatalogTree();
  const typeName = new Map(tree.types.map((t) => [t.id, t.name]));
  const brandName = new Map(tree.brands.map((b) => [b.id, b.name]));

  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Encontrá la figurita o carta que te falta
        </h1>
        <p className="text-muted">
          Marcá lo que tenés y lo que buscás. Te mostramos quién lo tiene y con quién podés
          intercambiar.
        </p>
        <CatalogFilters tree={tree} />
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Colecciones</h2>
        {tree.collections.length === 0 ? (
          <p className="text-muted">Todavía no hay colecciones cargadas.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {tree.collections.map((c) => (
              <Link
                key={c.id}
                href={`/coleccion/${c.slug}`}
                className="card overflow-hidden transition hover:border-accent"
              >
                <div className="aspect-video bg-background">
                  <img
                    src={imageUrl(c.coverImageKey)}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="font-medium leading-tight">{c.name}</p>
                  <p className="text-xs text-muted">
                    {typeName.get(c.typeId)} · {brandName.get(c.brandId)} · {c.year}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
