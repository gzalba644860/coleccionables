import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { openDirect } from "@/app/actions/messages";
import { Avatar } from "@/components/avatar";
import { ContactList } from "@/components/contact-list";
import { GridSkeleton, ItemCard, ItemGrid } from "@/components/item-card";
import { getCurrentUser } from "@/lib/auth";
import { RatingForm } from "@/components/rating-form";
import { ShareList } from "@/components/share-list";
import { Stars } from "@/components/stars";
import { rateUser, removeRating } from "@/app/actions/reputation";
import { getContacts, getPublicProfile, getStatusForItems, getUserList } from "@/lib/inventory";
import {
  canRate,
  getMyRating,
  getReputation,
  getReviews,
  getStarBreakdown,
} from "@/lib/reputation";
import { buildShareText, siteOrigin } from "@/lib/share";

export async function generateMetadata({ params }: PageProps<"/usuario/[id]">): Promise<Metadata> {
  const id = Number((await params).id);
  const profile = Number.isInteger(id) ? await getPublicProfile(id) : null;
  if (!profile) return {};
  const [have, want, rep] = await Promise.all([
    getUserList(id, "tengo"),
    getUserList(id, "busco"),
    getReputation(id),
  ]);
  const stars = rep.count ? ` · ★ ${rep.avg.toFixed(1).replace(".", ",")} (${rep.count})` : "";
  const description = `Ofrece ${have.length} · Busca ${want.length}${stars}. Mirá su lista y escribile para intercambiar.`;
  const title = `Lista de ${profile.displayName}`;
  return { title, description, openGraph: { title, description, type: "profile" } };
}

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

  const [have, want, viewer, rep, breakdown, reviews] = await Promise.all([
    getUserList(id, "tengo"),
    getUserList(id, "busco"),
    getCurrentUser(),
    getReputation(id),
    getStarBreakdown(id),
    getReviews(id),
  ]);
  const isMe = viewer?.id === id;
  const [eligible, myRating] =
    viewer && !isMe
      ? await Promise.all([canRate(viewer.id, id), getMyRating(viewer.id, id)])
      : [false, null];
  const profileUrl = isMe ? `${await siteOrigin()}/usuario/${id}` : "";
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
        <div className="flex gap-4">
          <Avatar user={profile} size={64} />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <a href="#reputacion" className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
              {rep.count ? (
                <>
                  <Stars value={rep.avg} />
                  <b>{rep.avg.toFixed(1).replace(".", ",")}</b>
                  <span className="whitespace-nowrap text-muted">
                    ({rep.count} {rep.count === 1 ? "calificación" : "calificaciones"})
                  </span>
                </>
              ) : (
                <span className="text-muted">Todavía sin calificaciones</span>
              )}
            </a>
            <p className="text-sm text-muted">
              {profile.city ?? "Sin ubicación"} · {have.length} para ofrecer · {want.length} buscados
            </p>
            {profile.bio && <p className="mt-2 whitespace-pre-line text-sm">{profile.bio}</p>}
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">Contacto</h2>
          {viewer ? (
            <div className="grid gap-3">
              {!isMe && (
                <form action={openDirect.bind(null, id)}>
                  <button className="btn-primary">Enviar mensaje</button>
                </form>
              )}
              <ContactList contacts={contacts} />
            </div>
          ) : (
            <p className="text-sm text-muted">
              <Link href="/ingresar" className="underline">
                Ingresá
              </Link>{" "}
              para ver cómo contactarlo o mandarle un mensaje.
            </p>
          )}
        </div>
      </div>

      {isMe && have.length + want.length > 0 && (
        <ShareList text={buildShareText(have, want, profileUrl)} url={profileUrl} />
      )}

      <section id="reputacion" className="card grid scroll-mt-20 gap-5 p-4 sm:grid-cols-[14rem_1fr]">
        <div className="grid content-start gap-3">
          <h2 className="text-lg font-semibold">Reputación</h2>
          {rep.count ? (
            <>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold leading-none">
                  {rep.avg.toFixed(1).replace(".", ",")}
                </span>
                <div className="grid gap-0.5">
                  <Stars value={rep.avg} size={18} />
                  <span className="text-xs text-muted">
                    {rep.count} {rep.count === 1 ? "calificación" : "calificaciones"}
                  </span>
                </div>
              </div>
              <ul className="grid gap-1">
                {[5, 4, 3, 2, 1].map((n) => (
                  <li key={n} className="flex items-center gap-2 text-xs text-muted">
                    <span className="w-3 text-right">{n}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                      <span
                        className="block h-full rounded-full bg-amber-400"
                        style={{ width: `${(breakdown[n - 1] / rep.count) * 100}%` }}
                      />
                    </span>
                    <span className="w-6">{breakdown[n - 1]}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted">
              {isMe
                ? "Cuando hagas un intercambio, pedile a la otra persona que te califique desde tu perfil."
                : "Nadie lo calificó todavía."}
            </p>
          )}
        </div>

        <div className="grid content-start gap-4">
          {viewer && !isMe && (
            <div id="calificar" className="grid scroll-mt-20 gap-2 rounded-lg bg-background p-3">
              <h3 className="text-sm font-semibold">
                {myRating ? "Tu calificación" : `¿Hiciste un intercambio con ${profile.displayName}?`}
              </h3>
              {eligible ? (
                <>
                  <RatingForm action={rateUser.bind(null, id)} initial={myRating} />
                  {myRating && (
                    <form action={removeRating.bind(null, id)}>
                      <button className="text-xs text-muted underline">Borrar mi calificación</button>
                    </form>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted">
                  Para calificar, primero coordiná el intercambio por mensaje. Cuando se hayan escrito
                  los dos, vas a poder marcarlo como hecho y dejar tu opinión.
                </p>
              )}
            </div>
          )}
          {reviews.length > 0 && (
            <ul className="grid gap-3">
              {reviews.map((r) => (
                <li key={r.id} className="flex gap-3">
                  <Link href={`/usuario/${r.rater.id}`}>
                    <Avatar user={r.rater} size={36} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <Link href={`/usuario/${r.rater.id}`} className="text-sm font-semibold hover:underline">
                        {r.rater.displayName}
                      </Link>
                      <Stars value={r.stars} size={13} />
                      <span className="text-xs text-muted">
                        {r.at.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {r.comment && <p className="mt-0.5 whitespace-pre-line text-sm">{r.comment}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

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
