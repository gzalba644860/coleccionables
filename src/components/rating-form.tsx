"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions/auth";
import { StarIcon } from "@/components/stars";

const LABELS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

/** Elegir estrellas + comentario. Sirve para calificar por primera vez o editar. */
export function RatingForm({
  action,
  initial,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: { stars: number; comment: string | null } | null;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [stars, setStars] = useState(initial?.stars ?? 0);
  const [hover, setHover] = useState(0);
  const shown = hover || stars;

  return (
    <form action={formAction} className="grid gap-3">
      <fieldset>
        <legend className="mb-1 text-sm text-muted">¿Cómo te fue con el intercambio?</legend>
        <div className="flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                onMouseEnter={() => setHover(n)}
                className={`cursor-pointer p-0.5 transition active:scale-90 ${
                  n <= shown ? "text-amber-400" : "text-border"
                }`}
              >
                <input
                  type="radio"
                  name="stars"
                  value={n}
                  checked={stars === n}
                  onChange={() => setStars(n)}
                  className="sr-only"
                  aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                />
                <StarIcon size={32} />
              </label>
            ))}
          </div>
          <span className="text-sm font-semibold">{LABELS[shown]}</span>
        </div>
      </fieldset>
      <textarea
        name="comment"
        defaultValue={initial?.comment ?? ""}
        maxLength={300}
        rows={2}
        placeholder="Contá cómo fue (opcional): puntualidad, estado de las figuritas…"
        className="input resize-none"
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-have">{state.ok}</p>}
      <button className="btn-primary justify-self-start" disabled={pending || !stars}>
        {pending ? "Guardando…" : initial ? "Actualizar calificación" : "Intercambio hecho: calificar"}
      </button>
    </form>
  );
}
