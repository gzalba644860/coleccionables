import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { ActionForm, Field } from "@/components/action-form";
import { GoogleError, GoogleLogin } from "@/components/google-login";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage({ searchParams }: PageProps<"/ingresar">) {
  return (
    <div className="mx-auto grid max-w-sm gap-4">
      <h1 className="text-2xl font-bold">Ingresar</h1>
      <Suspense>
        <GoogleError searchParams={searchParams as Promise<{ error?: string }>} />
      </Suspense>
      <GoogleLogin />
      <ActionForm action={login} submit="Ingresar" className="card grid gap-3 p-4">
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </ActionForm>
      <p className="text-center text-sm text-muted">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="text-accent underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
