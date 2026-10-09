"use server";

import { z } from "zod";
import { User } from "@/lib/data";

const SignUpSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254)),
  password: z
    .string()
    .min(8, "Passwords need at least 8 characters.")
    .max(128, "Passwords can be at most 128 characters."),
});

export type SignUpResult = { ok: true } | { ok: false; error: string };

/** Creates an account. The client signs in with the same credentials once this succeeds. */
export async function signUp(formData: FormData): Promise<SignUpResult> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    await User.create(parsed.data);
    return { ok: true };
  } catch (error) {
    // Unique violation on users.email. Matched by code: instanceof PostgresError fails across bundles.
    if (error instanceof Error && "code" in error && error.code === "23505") {
      return { ok: false, error: "An account with that email already exists." };
    }
    throw error;
  }
}
