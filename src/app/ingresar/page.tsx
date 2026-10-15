import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { ActionForm, Field } from "@/components/action-form";
import { LogoMark } from "@/components/logo";
import { GoogleError, GoogleLogin } from "@/components/google-login";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage({ searchParams }: PageProps<"/ingresar">) {
  return (
    <div className="mx-auto grid w-full max-w-sm gap-4 sm:pt-6">
      <div className="grid justify-items-center gap-2 text-center">
        <LogoMark className="size-12" />
        <h1 className="page-title">Ingresar</h1>
        <p className="text-sm text-muted">Qué bueno verte de nuevo. Entrá para seguir con tu álbum.</p>
      </div>
      <Suspense>
        <GoogleError searchParams={searchParams as Promise<{ error?: string }>} />
      </Suspense>
      <GoogleLogin />
      <ActionForm action={login} submit="Ingresar" className="card grid gap-4 p-5">
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
        <Link href="/registro" className="link">
          Registrate
        </Link>
      </p>
    </div>
  );
}
