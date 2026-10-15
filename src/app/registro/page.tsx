import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { register } from "@/app/actions/auth";
import { ActionForm, Field } from "@/components/action-form";
import { GoogleError, GoogleLogin } from "@/components/google-login";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage({ searchParams }: PageProps<"/registro">) {
  return (
    <div className="mx-auto grid max-w-sm gap-4">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      <Suspense>
        <GoogleError searchParams={searchParams as Promise<{ error?: string }>} />
      </Suspense>
      <GoogleLogin />
      <ActionForm action={register} submit="Crear cuenta" className="card grid gap-3 p-4">
        <Field label="Nombre o apodo" name="displayName" autoComplete="nickname" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Contraseña (mín. 8)"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Field label="Ciudad / barrio (opcional)" name="city" autoComplete="address-level2" />
      </ActionForm>
      <p className="text-center text-sm text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/ingresar" className="text-accent underline">
          Ingresá
        </Link>
      </p>
    </div>
  );
}
