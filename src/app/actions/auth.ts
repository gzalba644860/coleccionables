"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { isAdminEmail } from "@/lib/admins";

export type FormState = { error?: string; ok?: string } | undefined;

const registerSchema = z.object({
  displayName: z.string().trim().min(2, "El nombre es muy corto").max(40),
  email: z.email("Email inválido").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  city: z.string().trim().max(60).optional(),
});

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { displayName, email, password, city } = parsed.data;

  const exists = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get();
  if (exists) return { error: "Ya existe una cuenta con ese email" };

  // El primer usuario registrado (o un email de ADMIN_EMAIL) queda como administrador.
  const asAdmin =
    isAdminEmail(email) ||
    !(await db.select({ id: schema.users.id }).from(schema.users).limit(1).get());

  const [user] = await db
    .insert(schema.users)
    .values({
      displayName,
      email,
      city: city || null,
      passwordHash: await hashPassword(password),
      role: asAdmin ? "admin" : "user",
      status: asAdmin ? "approved" : "pending",
    })
    .returning({ id: schema.users.id });

  await createSession(user.id);
  redirect(asAdmin ? "/mi-cuenta/perfil" : "/pendiente");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
});

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const { email, password } = loginSchema.parse(Object.fromEntries(formData));
  const user = await db
    .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get();
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email o contraseña incorrectos" };
  }
  await createSession(user.id);
  redirect("/mi-cuenta");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
