"use client";

import { useTransition } from "react";
import { changeQuantity, toggleItem } from "@/app/actions/inventory";

/** Botones rápidos "Lo tengo" / "Lo busco" (+ repetidas) sobre un ítem. */
export function ItemActions({
  itemId,
  tengo,
  busco,
  loggedIn,
}: {
  itemId: number;
  tengo?: number;
  busco?: boolean;
  loggedIn: boolean;
}) {
  const [pending, start] = useTransition();

  if (!loggedIn) {
    return (
      <a
        href="/ingresar"
        className="flex h-9 items-center justify-center rounded-lg bg-subtle text-xs font-semibold text-muted transition hover:text-foreground"
      >
        Ingresá para marcarlo
      </a>
    );
  }

  const base =
    "flex h-9 flex-1 items-center justify-center gap-1 rounded-lg text-xs font-semibold transition active:scale-95";
  return (
    <div className={`flex gap-1.5 transition-opacity ${pending ? "opacity-60" : ""}`}>
      {tengo ? (
        <div className={`${base} justify-between bg-have text-white shadow-soft`}>
          <button
            aria-label="Restar"
            className="grid h-full w-8 place-items-center rounded-l-lg text-base hover:bg-black/10"
            disabled={pending}
            onClick={() => start(() => changeQuantity(itemId, -1))}
          >
            −
          </button>
          <span className="whitespace-nowrap tabular-nums">✓ {tengo}</span>
          <button
            aria-label="Sumar"
            className="grid h-full w-8 place-items-center rounded-r-lg text-base hover:bg-black/10"
            disabled={pending}
            onClick={() => start(() => changeQuantity(itemId, 1))}
          >
            +
          </button>
        </div>
      ) : (
        <button
          disabled={pending}
          onClick={() => start(() => toggleItem(itemId, "tengo"))}
          className={`${base} bg-have-soft text-have hover:bg-have hover:text-white`}
        >
          Lo tengo
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => start(() => toggleItem(itemId, "busco"))}
        className={`${base} ${
          busco
            ? "bg-want text-white shadow-soft"
            : "bg-want-soft text-want hover:bg-want hover:text-white"
        }`}
      >
        {busco ? "Lo busco ✓" : "Lo busco"}
      </button>
    </div>
  );
}
