import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { openDirect } from "@/app/actions/messages";
import { Avatar } from "@/components/avatar";
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
      <div className="card overflow-hidden">
        <div aria-hidden className="h-24 bg-gradient-to-br from-accent via-[#c8441f] to-[#5a1f10] sm:h-32" />
        <div className="grid gap-5 px-4 pb-5 sm:grid-cols-[1fr_auto] sm:px-6">
          <div className="-mt-10 grid gap-3 sm:-mt-12">
            <div className="w-fit rounded-full bg-card p-1 shadow-soft">
              <Avatar user={profile} size={88} />
            </div>
            <div className="min-w-0">
              <h1 className="page-title">{profile.displayName}</h1>
              <p className="text-sm text-muted">{profile.city ?? "Sin ubicación"}</p>
            </div>
            <dl className="flex gap-6 text-sm">
              <div>
                <dd className="text-xl font-extrabold tabular-nums text-have">{have.length}</dd>
                <dt className="text-muted">para ofrecer</dt>
              </div>
              <div>
                <dd className="text-xl font-extrabold tabular-nums text-want">{want.length}</dd>
                <dt className="text-muted">buscadas</dt>
              </div>
            </dl>
            {profile.bio && <p className="max-w-prose whitespace-pre-line text-sm">{profile.bio}</p>}
          </div>
          <div className="grid content-start gap-3 sm:min-w-64 sm:pt-4">
            {viewer ? (
              <>
                {viewer.id !== id && (
                  <form action={openDirect.bind(null, id)}>
                    <button className="btn-primary w-full">Enviar mensaje</button>
                  </form>
                )}
                <div className="rounded-xl bg-subtle p-3">
                  <h2 className="eyebrow mb-2">Contacto</h2>
                  <ContactList contacts={contacts} />
                </div>
              </>
            ) : (
              <p className="rounded-xl bg-subtle p-3 text-sm text-muted">
                <Link href="/ingresar" className="link">
                  Ingresá
                </Link>{" "}
                para ver cómo contactarlo o mandarle un mensaje.
              </p>
            )}
          </div>
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
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span className={`size-2.5 rounded-full ${color.replace("text-", "bg-")}`} aria-hidden />
        {title}
        <span className="text-sm font-medium text-muted">{children.length}</span>
      </h2>
      {children.length ? (
        <ItemGrid>{children}</ItemGrid>
      ) : (
        <p className="card p-4 text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}
