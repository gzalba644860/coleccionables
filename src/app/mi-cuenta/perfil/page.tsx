import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { logout } from "@/app/actions/auth";
import { addContact, removeContact, updateProfile } from "@/app/actions/profile";
import { ActionForm, Field } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { AvatarUpload } from "@/components/avatar-upload";
import { contactLabel } from "@/components/contact-list";
import { db, schema } from "@/db";
import { CONTACT_KINDS } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getContacts } from "@/lib/inventory";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="card h-60 animate-pulse" />}>
      <ProfileForms />
    </Suspense>
  );
}

async function ProfileForms() {
  const user = await requireUser();
  const [me, contacts] = await Promise.all([
    db
      .select({
        displayName: schema.users.displayName,
        city: schema.users.city,
        bio: schema.users.bio,
        email: schema.users.email,
      })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .get(),
    getContacts(user.id),
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card grid content-start gap-3 p-4">
        <h2 className="font-semibold">Mis datos</h2>
        <div className="flex items-center gap-4">
          <Avatar user={user} size={72} />
          <div className="grid gap-1">
            <p className="text-xs text-muted">Cuenta: {me?.email}</p>
            <AvatarUpload hasPhoto={user.avatarVersion > 0} />
          </div>
        </div>
        <ActionForm action={updateProfile} submit="Guardar datos">
          <Field label="Nombre o apodo" name="displayName" defaultValue={me?.displayName} required />
          <Field label="Ciudad / barrio" name="city" defaultValue={me?.city ?? ""} />
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Sobre mí (opcional)</span>
            <textarea
              name="bio"
              rows={3}
              maxLength={300}
              defaultValue={me?.bio ?? ""}
              placeholder="Qué colecciono, por dónde me muevo, cómo prefiero intercambiar…"
              className="input"
            />
          </label>
        </ActionForm>
        <form action={logout}>
          <button className="btn-ghost w-full">Cerrar sesión</button>
        </form>
      </section>

      <section className="card grid content-start gap-3 p-4">
        <h2 className="font-semibold">Medios de contacto</h2>
        <p className="text-xs text-muted">
          Solo los ven usuarios registrados. Por acá coordinan y se pasan fotos reales.
        </p>
        <ul className="grid gap-2">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                <span className="text-muted">{contactLabel(c.kind)}:</span> {c.value}
              </span>
              <form action={removeContact.bind(null, c.id)}>
                <button className="text-xs text-red-600 underline">Quitar</button>
              </form>
            </li>
          ))}
        </ul>
        <ActionForm action={addContact} submit="Agregar contacto">
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Tipo</span>
            <select name="kind" className="input">
              {CONTACT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {contactLabel(k)}
                </option>
              ))}
            </select>
          </label>
          <Field label="Dato" name="value" placeholder="+54 9 11 1234-5678 / @usuario / mail" required />
        </ActionForm>
      </section>
    </div>
  );
}
