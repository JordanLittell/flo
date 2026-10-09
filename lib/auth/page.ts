import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./access";
import { validateCallback } from "./callback";

/**
 * The ?callbackUrl= on a sign-in or sign-up page, validated against this request's own origin.
 * Someone already signed in is sent straight there instead.
 */
export async function callbackFromSearchParams(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<string> {
  const { callbackUrl } = await searchParams;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const safe = validateCallback(typeof callbackUrl === "string" ? callbackUrl : null, `${protocol}://${host}`);
  if (await getCurrentUser()) redirect(safe);
  return safe;
}
