/**
 * Where to send someone after signing in. Only paths on our own origin are allowed, so a crafted
 * ?callbackUrl= can't bounce people to another site. Anything else falls back to the home page.
 */
export function validateCallback(url: string | null | undefined, trustedOrigin: string): string {
  if (!url) return "/";
  try {
    const resolved = new URL(url, trustedOrigin);
    if (resolved.origin !== new URL(trustedOrigin).origin) return "/";
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return "/";
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return "/";
  }
}
