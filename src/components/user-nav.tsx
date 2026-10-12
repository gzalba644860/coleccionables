import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export async function UserNav() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/ingresar" className="btn-primary !py-2">
        Ingresar
      </Link>
    );
  }
  return (
    <>
      {user.role === "admin" && (
        <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-background">
          Admin
        </Link>
      )}
      <Link href="/mi-cuenta" className="btn-primary !py-2">
        Mi colección
      </Link>
    </>
  );
}
