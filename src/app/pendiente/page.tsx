import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Cuenta en revisión" };

export default function PendingPage() {
  return (
    <div className="mx-auto grid max-w-sm gap-4">
      <Suspense fallback={<div className="card h-40 animate-pulse" />}>
        <PendingStatus />
      </Suspense>
    </div>
  );
}

async function PendingStatus() {
  const user = await getSessionUser();
  if (!user) redirect("/ingresar");
  if (user.status === "approved") redirect("/mi-cuenta");

  return (
    <div className="card grid gap-3 p-4">
      {user.status === "pending" ? (
        <>
          <h1 className="text-xl font-bold">Tu cuenta está en revisión</h1>
          <p className="text-sm text-muted">
            Hola {user.displayName}. Un administrador tiene que aprobar tu cuenta antes de que
            puedas usar el portal. Volvé a entrar en un rato.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold">Tu cuenta no fue aprobada</h1>
          <p className="text-sm text-muted">
            Un administrador no aprobó esta cuenta. Si creés que es un error, contactalo.
          </p>
        </>
      )}
      <form action={logout}>
        <button className="btn-ghost w-full">Salir</button>
      </form>
    </div>
  );
}
