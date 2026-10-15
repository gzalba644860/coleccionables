import Link from "next/link";
import { getCatalogTree, getCollectionPreviews, getCommunityStats } from "@/lib/catalog";
import { imageUrl } from "@/lib/images";

const STEPS = [
  {
    title: "Marcá tu álbum",
    body: "Tocá “Lo tengo” o “Lo busco” en cada figurita. Las repetidas se cuentan solas.",
  },
  {
    title: "Encontrá coincidencias",
    body: "Te mostramos quién tiene lo que te falta, primero los que buscan lo que te sobra.",
  },
  {
    title: "Cambiá o comprá",
    body: "Escribile por el chat del sitio y arreglen el cambio en persona o por correo.",
  },
];

export default async function Home() {
  // Catálogo y números cacheados ("use cache"): entran en el shell estático de la página.
  const [tree, previews, stats] = await Promise.all([
    getCatalogTree(),
    getCollectionPreviews(),
    getCommunityStats(),
  ]);
  const typeName = new Map(tree.types.map((t) => [t.id, t.name]));
  const brandName = new Map(tree.brands.map((b) => [b.id, b.name]));
  const hero = tree.collections.map((c) => previews[c.id]).find((p) => p?.length === 3);
  const fmt = (n: number) => n.toLocaleString("es-AR");

  return (
    <div className="grid gap-12 sm:gap-16">
      <section className="relative -mx-4 -mt-6 overflow-hidden bg-ink px-5 pb-8 pt-9 text-ink-fg sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-10 sm:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 size-[28rem] rounded-full bg-accent/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-20 size-80 rounded-full bg-want/25 blur-3xl"
        />
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div className="grid max-w-xl gap-5">
            <p className="w-fit rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              Figuritas y cartas coleccionables
            </p>
            <h1 className="text-[2rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              Completá el álbum cambiando con otros coleccionistas
            </h1>
            <p className="text-base text-white/70 sm:text-lg">
              Marcá lo que tenés y lo que te falta. Te decimos quién la tiene y con quién te
              conviene cambiar.
            </p>
            <form action="/buscar" className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-lift">
              <input
                name="q"
                placeholder="Ej: 10, Messi, Argentina"
                inputMode="search"
                aria-label="Buscar figurita"
                className="min-w-0 flex-1 bg-transparent px-3 text-base text-[#17161a] outline-none placeholder:text-[#8a8790]"
              />
              <button className="btn-primary !rounded-xl">Buscar</button>
            </form>
            {/* Con pocos usuarios los números juegan en contra: se muestran desde 20. */}
            {stats.users >= 20 && (
              <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <Stat value={fmt(stats.users)} label="coleccionistas" />
                <Stat value={fmt(stats.offered)} label="ofrecidas" />
                <Stat value={fmt(stats.wanted)} label="buscadas" />
              </dl>
            )}
          </div>
          {hero && (
            <div aria-hidden className="relative mx-auto hidden h-72 w-72 md:block">
              {hero.map((key, i) => (
                <img
                  key={key}
                  src={imageUrl(key)}
                  alt=""
                  className="absolute left-1/2 top-1/2 w-40 rounded-xl border-4 border-white shadow-2xl"
                  style={{
                    transform: `translate(-50%, -50%) translateX(${(i - 1) * 70}px) rotate(${(i - 1) * 12}deg) translateY(${Math.abs(i - 1) * 14}px)`,
                    zIndex: i === 1 ? 2 : 1,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2 className="text-xl font-bold sm:text-2xl">Colecciones</h2>
          </div>
          <Link href="/buscar" className="text-sm font-semibold text-accent hover:underline">
            Búsqueda avanzada →
          </Link>
        </div>
        {tree.collections.length === 0 ? (
          <p className="text-muted">Todavía no hay colecciones cargadas.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3">
            {tree.collections.map((c) => (
              <CollectionCard
                key={c.id}
                href={`/coleccion/${c.slug}`}
                name={c.name}
                year={c.year}
                meta={`${typeName.get(c.typeId)} · ${brandName.get(c.brandId)}`}
                total={c.totalItems}
                cover={c.coverImageKey}
                preview={previews[c.id] ?? []}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-5">
        <div>
          <p className="eyebrow">Cómo funciona</p>
          <h2 className="text-xl font-bold sm:text-2xl">Tres pasos y a cambiar</h2>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card grid content-start gap-2 p-5">
              <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-sm font-extrabold text-accent">
                {i + 1}
              </span>
              <h3 className="font-bold">{s.title}</h3>
              <p className="text-sm text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="sr-only">{label}</dt>
      <dd className="text-lg font-bold tabular-nums">{value}</dd>
      <span className="text-white/60">{label}</span>
    </div>
  );
}

function CollectionCard({
  href,
  name,
  year,
  meta,
  total,
  cover,
  preview,
}: {
  href: string;
  name: string;
  year: number;
  meta: string;
  total: number | null;
  cover: string | null;
  preview: string[];
}) {
  return (
    <Link
      href={href}
      className="card group overflow-hidden transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lift"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-accent to-[#7a2a14]">
        {preview.length > 0 && (
          <span
            aria-hidden
            className="absolute -bottom-4 left-3 text-[5.5rem] font-black leading-none tracking-tighter text-white/15"
          >
            {year}
          </span>
        )}
        {cover ? (
          <img
            src={imageUrl(cover)}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div aria-hidden className="absolute inset-0">
            {(preview.length ? preview : [null, null, null]).map((key, i, all) => {
              const offset = i - (all.length - 1) / 2;
              const style = {
                transform: `translate(-50%, -50%) translateX(${offset * 62}%) rotate(${offset * 10}deg)`,
                zIndex: i === 1 ? 2 : 1,
              };
              const cls =
                "absolute left-[62%] top-[58%] aspect-[3/4] w-[26%] rounded-md border-2 border-white shadow-xl transition duration-300 group-hover:scale-105";
              return key ? (
                <img key={key} src={imageUrl(key)} alt="" loading="lazy" className={`${cls} object-cover`} style={style} />
              ) : (
                // Sin imágenes cargadas: figuritas "en blanco" con el año.
                <span
                  key={i}
                  className={`${cls} grid place-items-center bg-white/15 text-lg font-black text-white backdrop-blur-sm`}
                  style={style}
                >
                  {i === 1 ? year : ""}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-bold leading-tight">{name}</p>
          <p className="text-xs text-muted">
            {meta} · {year}
          </p>
        </div>
        {total ? (
          <span className="shrink-0 rounded-full bg-subtle px-2.5 py-1 text-xs font-semibold tabular-nums text-muted">
            {total.toLocaleString("es-AR")}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
