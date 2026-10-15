import "server-only";

/** Emails del secreto ADMIN_EMAIL (separados por comas): entran como admin aprobado. */
export function isAdminEmail(email: string) {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}
