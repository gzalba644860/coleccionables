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
  const [open, setOpen] = useState(Boolean(type || brand || year || collection));

  const byType = useMemo(
    () => tree.collections.filter((c) => !type || c.typeId === Number(type)),
    [tree, type],
  );
  const brandIds = new Set(byType.map((c) => c.brandId));
  const byBrand = byType.filter((c) => !brand || c.brandId === Number(brand));
  const years = [...new Set(byBrand.map((c) => c.year))].sort((a, b) => b - a);
  const byYear = byBrand.filter((c) => !year || c.year === Number(year));

  return (
    <form action="/buscar" className="card grid gap-3 p-3 sm:p-4">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            name="q"
            defaultValue={initial.q}
            placeholder="Número o nombre: 10, Messi…"
            aria-label="Número o nombre"
            className="input !pl-11"
            inputMode="search"
          />
        </div>
        <button className="btn-primary">Buscar</button>
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground sm:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        {open ? "Ocultar filtros" : "Filtrar por tipo, marca, año o colección"}
      </button>
      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${open ? "" : "max-sm:hidden"}`}>
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
      </div>
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
    <label className="grid min-w-0 gap-1 text-sm">
      <span className="text-xs font-semibold text-muted">{label}</span>
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
