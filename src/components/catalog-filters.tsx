"use client";

import { useMemo, useState } from "react";
import type { CatalogTree } from "@/lib/catalog";

type Initial = {
  type?: string;
  brand?: string;
  year?: string;
  collection?: string;
  q?: string;
};

/**
 * Filtros en cascada: tipo → marca → año → colección (+ texto/número).
 * Cada nivel solo ofrece opciones que existen según lo elegido antes.
 * Envía un GET a /buscar, así la búsqueda queda en la URL y se puede compartir.
 */
export function CatalogFilters({
  tree,
  initial = {},
}: {
  tree: CatalogTree;
  initial?: Initial;
}) {
  const [type, setType] = useState(initial.type ?? "");
  const [brand, setBrand] = useState(initial.brand ?? "");
  const [year, setYear] = useState(initial.year ?? "");
  const [collection, setCollection] = useState(initial.collection ?? "");

  const byType = useMemo(
    () => tree.collections.filter((c) => !type || c.typeId === Number(type)),
    [tree, type],
  );
  const brandIds = new Set(byType.map((c) => c.brandId));
  const byBrand = byType.filter((c) => !brand || c.brandId === Number(brand));
  const years = [...new Set(byBrand.map((c) => c.year))].sort((a, b) => b - a);
  const byYear = byBrand.filter((c) => !year || c.year === Number(year));

  return (
    <form action="/buscar" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
      <Select
        name="type"
        label="Tipo"
        value={type}
        onChange={(v) => {
          setType(v);
          setBrand("");
          setYear("");
          setCollection("");
        }}
        options={tree.types.map((t) => [String(t.id), t.name])}
      />
      <Select
        name="brand"
        label="Marca"
        value={brand}
        onChange={(v) => {
          setBrand(v);
          setYear("");
          setCollection("");
        }}
        options={tree.brands
          .filter((b) => brandIds.has(b.id))
          .map((b) => [String(b.id), b.name])}
      />
      <Select
        name="year"
        label="Año"
        value={year}
        onChange={(v) => {
          setYear(v);
          setCollection("");
        }}
        options={years.map((y) => [String(y), String(y)])}
      />
      <Select
        name="collection"
        label="Colección"
        value={collection}
        onChange={setCollection}
        options={byYear.map((c) => [String(c.id), `${c.name} (${c.year})`])}
      />
      <label className="grid gap-1 text-sm sm:col-span-2 lg:col-span-1">
        <span className="text-muted">Número o nombre</span>
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={initial.q}
            placeholder="Ej: 10, Messi"
            className="input"
            inputMode="search"
          />
          <button className="btn-primary">Buscar</button>
        </div>
      </label>
    </form>
  );
}

function Select({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <select
        name={value ? name : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      >
        <option value="">Todos</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
