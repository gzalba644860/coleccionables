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
      <a href="/ingresar" className="block text-center text-xs text-muted underline">
        Ingresá para marcarlo
      </a>
    );
  }

  return (
    <div className={`flex gap-1 ${pending ? "opacity-60" : ""}`}>
      {tengo ? (
        <div className="flex flex-1 items-center justify-between rounded-lg bg-have text-xs font-semibold text-white">
          <button
            aria-label="Restar"
            className="px-2.5 py-1.5"
            disabled={pending}
            onClick={() => start(() => changeQuantity(itemId, -1))}
          >
            −
          </button>
          <span className="whitespace-nowrap">✓ {tengo}</span>
          <button
            aria-label="Sumar"
            className="px-2.5 py-1.5"
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
          className="flex-1 rounded-lg border border-have px-2 py-1.5 text-xs font-semibold text-have"
        >
          Lo tengo
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => start(() => toggleItem(itemId, "busco"))}
        className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
          busco ? "bg-want text-white" : "border border-want text-want"
        }`}
      >
        {busco ? "Lo busco ✓" : "Lo busco"}
      </button>
    </div>
  );
}
