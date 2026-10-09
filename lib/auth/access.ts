import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cache } from "react";
import { User } from "@/lib/data";
import { authOptions } from "./options";

/**
 * Who may see what. proxy.ts applies these rules to every request from the session cookie alone;
 * getCurrentUser and requireUser are the secure checks that pages, actions and routes run against
 * the database before touching data.
 */
export const SIGN_IN_PATH = "/sign-in";
export const PUBLIC_PATHS = [SIGN_IN_PATH, "/sign-up"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/auth/");
}

/** The signed-in user, or null. Also null if the account was deleted after the cookie was issued. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? User.findById(session.user.id) : null;
});

/** The signed-in user; anyone else is sent to sign in. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(SIGN_IN_PATH);
  return user;
}
