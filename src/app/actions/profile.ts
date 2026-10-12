"use server";

import { refresh } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { CONTACT_KINDS } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import type { FormState } from "./auth";

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(40),
  city: z.string().trim().max(60).optional(),
});

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revisá el nombre (2 a 40 caracteres)" };
  await db
    .update(schema.users)
    .set({ displayName: parsed.data.displayName, city: parsed.data.city || null })
    .where(eq(schema.users.id, user.id));
  refresh();
  return { ok: "Perfil guardado" };
}

const contactSchema = z.object({
  kind: z.enum(CONTACT_KINDS),
  value: z.string().trim().min(3, "Completá el dato de contacto").max(120),
});

export async function addContact(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.insert(schema.contactMethods).values({ userId: user.id, ...parsed.data });
  refresh();
  return { ok: "Contacto agregado" };
}

export async function removeContact(id: number) {
  const user = await requireUser();
  await db
    .delete(schema.contactMethods)
    .where(and(eq(schema.contactMethods.id, id), eq(schema.contactMethods.userId, user.id)));
  refresh();
}
