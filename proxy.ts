import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath, SIGN_IN_PATH } from "@/lib/auth/access";

/**
 * The first gate: every request without a session cookie is sent to sign in (pages) or refused
 * (API). It only reads the cookie; pages and routes still check the user against the database.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = Boolean(await getToken({ req: request }));

  // Signed-in visitors to the sign-in pages are redirected by the pages themselves, after checking the
  // account still exists; doing it here from the cookie alone would loop for a deleted account.
  if (isPublicPath(pathname) || signedIn) return NextResponse.next();

  // if this is a direct api call, return a 401 (redirects not user-friendly for a headless client)
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const signIn = new URL(SIGN_IN_PATH, request.url);
  signIn.searchParams.set("callbackUrl", `${pathname}${search}`);
  return NextResponse.redirect(signIn);
}

export const config = {
  // Everything except Next's own assets and files in public/.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3)$).*)"],
};
