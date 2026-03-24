const DEFAULT = "/today";

/**
 * Same-origin path only; blocks /login and /api/auth to avoid redirect loops.
 */
export function safePostLoginPath(
  raw: string | undefined,
  requestOrigin: string,
): string {
  if (!raw?.trim()) return DEFAULT;
  const s = raw.trim();
  if (s.startsWith("//")) return DEFAULT;

  let pathname: string;
  let search = "";

  if (s.includes("://")) {
    if (!requestOrigin) return DEFAULT;
    try {
      const u = new URL(s);
      if (u.origin !== requestOrigin) return DEFAULT;
      pathname = u.pathname;
      search = u.search;
    } catch {
      return DEFAULT;
    }
  } else {
    if (!s.startsWith("/")) return DEFAULT;
    const q = s.indexOf("?");
    if (q >= 0) {
      pathname = s.slice(0, q);
      search = s.slice(q);
    } else {
      pathname = s;
    }
  }

  if (pathname === "/login" || pathname.startsWith("/api/auth")) return DEFAULT;
  return pathname + search;
}
