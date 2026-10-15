import type { Metadata } from "next";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import {
  bulkItems,
  createBrand,
  createCollection,
  createType,
  reviewUser,
} from "@/app/actions/admin";
import { ActionForm, Field } from "@/components/action-form";
import { requireAdmin } from "@/lib/auth";
import { getCatalogTree } from "@/lib/catalog";
import { db, schema } from "@/db";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Cuentas nuevas</h1>
      <Suspense fallback={<div className="card h-24 animate-pulse" />}>
        <PendingUsers />
      </Suspense>
      <h1 className="text-2xl font-bold">Carga del catálogo</h1>
      <Suspense fallback={<div className="card h-60 animate-pulse" />}>
        <AdminForms />
      </Suspense>
    </div>
  );
}

async function PendingUsers() {
  await requireAdmin();
  const pending = await db
    .select({
      id: schema.users.id,
      displayName: schema.users.displayName,
      email: schema.users.email,
      city: schema.users.city,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.status, "pending"))
    .orderBy(desc(schema.users.createdAt));

  if (pending.length === 0) {
    return <p className="card p-4 text-sm text-muted">No hay cuentas esperando aprobación.</p>;
  }
  return (
    <ul className="card divide-y divide-border">
      {pending.map((u) => (
        <li key={u.id} className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{u.displayName}</p>
            <p className="truncate text-sm text-muted">
              {u.email}
              {u.city && ` · ${u.city}`} · {u.createdAt.toLocaleDateString("es-AR")}
            </p>
          </div>
          <form action={reviewUser} className="flex gap-2">
            <input type="hidden" name="userId" value={u.id} />
            <button name="status" value="approved" className="btn-primary !py-2">
              Aprobar
            </button>
            <button name="status" value="rejected" className="btn-ghost !py-2">
              Rechazar
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

async function AdminForms() {
  await requireAdmin();
  const tree = await getCatalogTree();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card grid content-start gap-3 p-4">
        <h2 className="font-semibold">Nuevo tipo de artículo</h2>
        <ActionForm action={createType} submit="Crear tipo">
          <Field label="Nombre" name="name" placeholder="Figuritas, Cartas…" required />
        </ActionForm>
        <h2 className="mt-4 font-semibold">Nueva marca</h2>
        <ActionForm action={createBrand} submit="Crear marca">
          <Field label="Nombre" name="name" placeholder="Panini, Topps, Konami…" required />
        </ActionForm>
      </section>

      <section className="card grid content-start gap-3 p-4">
        <h2 className="font-semibold">Nueva colección</h2>
        <ActionForm action={createCollection} submit="Crear colección">
          <Field label="Nombre" name="name" placeholder="Mundial 2026" required />
          <Select name="typeId" label="Tipo" options={tree.types.map((t) => [t.id, t.name])} />
          <Select name="brandId" label="Marca" options={tree.brands.map((b) => [b.id, b.name])} />
          <Field label="Año" name="year" type="number" min={1900} max={2100} required />
          <Field label="Total de ítems (opcional)" name="totalItems" type="number" min={0} />
        </ActionForm>
      </section>

      <section className="card grid content-start gap-3 p-4 md:col-span-2">
        <h2 className="font-semibold">Carga masiva de ítems</h2>
        <p className="text-xs text-muted">
          Una línea por ítem: <code>codigo;nombre;variante;clave_imagen</code> (variante e
          imagen opcionales). Sin clave de imagen se usa{" "}
          <code>&lt;slug-colección&gt;/&lt;código&gt;.webp</code>: subí las imágenes al bucket con
          ese nombre y quedan vinculadas solas.
        </p>
        <ActionForm action={bulkItems} submit="Cargar ítems">
          <Select
            name="collectionId"
            label="Colección"
            options={tree.collections.map((c) => [c.id, `${c.name} (${c.year}) — ${c.slug}`])}
          />
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Ítems</span>
            <textarea
              name="lines"
              rows={8}
              className="input font-mono text-sm"
              placeholder={"1;Escudo Argentina\n2;Lionel Messi\n2;Lionel Messi;brillante"}
              required
            />
          </label>
        </ActionForm>
      </section>
    </div>
  );
}

function Select({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: [number, string][];
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <select name={name} className="input" required>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
