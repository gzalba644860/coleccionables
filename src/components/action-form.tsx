"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";

/** Formulario con estado (error/ok) y botón deshabilitado mientras envía. */
export function ActionForm({
  action,
  submit,
  children,
  className = "grid gap-3",
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submit: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-have">{state.ok}</p>}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Enviando…" : submit}
      </button>
    </form>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <input className="input" {...props} />
    </label>
  );
}
