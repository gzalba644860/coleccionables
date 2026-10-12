import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContactList } from "@/components/contact-list";
import { GridSkeleton, ItemCard, ItemGrid } from "@/components/item-card";
import { getCurrentUser } from "@/lib/auth";
import { getContacts, getPublicProfile, getStatusForItems, getUserList } from "@/lib/inventory";

export default function UserPage({ params }: PageProps<"/usuario/[id]">) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const profile = await getPublicProfile(id);
  if (!profile) notFound();

  const [have, want, viewer] = await Promise.all([
    getUserList(id, "tengo"),
    getUserList(id, "busco"),
    getCurrentUser(),
  ]);
  // Los datos de contacto solo se muestran a usuarios registrados.
  const contacts = viewer ? await getContacts(id) : [];
  const status = viewer
    ? await getStatusForItems(viewer.id, [...have, ...want].map((i) => i.itemId))
    : {};

  const toCard = (i: (typeof have)[number]) => ({
    id: i.itemId,
    code: i.code,
    name: i.name,
    section: i.section,
    variant: i.variant,
    imageKey: i.imageKey,
    subtitle:
      i.price != null
        ? `${i.collectionName} · $${i.price.toLocaleString("es-AR")}`
        : i.collectionName,
  });

  return (
    <div className="grid gap-8">
      <div className="card grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          <p className="text-sm text-muted">
            {profile.city ?? "Sin ubicación"} · {have.length} para ofrecer · {want.length} buscados
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">Contacto</h2>
          {viewer ? (
            <ContactList contacts={contacts} />
          ) : (
            <p className="text-sm text-muted">
              <Link href="/ingresar" className="underline">
                Ingresá
              </Link>{" "}
              para ver cómo contactarlo.
            </p>
          )}
        </div>
      </div>

      <Section title="Ofrece" color="text-have" empty="No tiene ítems para ofrecer.">
        {have.map((i) => (
          <ItemCard key={i.itemId} item={toCard(i)} status={status[i.itemId]} loggedIn={!!viewer} />
        ))}
      </Section>
      <Section title="Busca" color="text-want" empty="No está buscando nada por ahora.">
        {want.map((i) => (
          <ItemCard key={i.itemId} item={toCard(i)} status={status[i.itemId]} loggedIn={!!viewer} />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  color,
  empty,
  children,
}: {
  title: string;
  color: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <section className="grid gap-3">
      <h2 className={`text-lg font-semibold ${color}`}>
        {title} ({children.length})
      </h2>
      {children.length ? <ItemGrid>{children}</ItemGrid> : <p className="text-sm text-muted">{empty}</p>}
    </section>
  );
}
