import type { Metadata } from "next";
import { Suspense } from "react";
import { bulkItems, createBrand, createCollection, createType } from "@/app/actions/admin";
import { ActionForm, Field } from "@/components/action-form";
import { requireAdmin } from "@/lib/auth";
import { getCatalogTree } from "@/lib/catalog";

export const metadata: Metadata = { title: "Admin catálogo" };

export default function AdminPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Carga del catálogo</h1>
      <Suspense fallback={<div className="card h-60 animate-pulse" />}>
        <AdminForms />
      </Suspense>
    </div>
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
