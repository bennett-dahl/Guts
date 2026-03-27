/** First value when proxies send comma-separated headers (e.g. x-forwarded-host). */
function firstCsv(value: string | null | undefined): string {
  if (!value) return "";
  const part = value.split(",")[0]?.trim();
  return part ?? "";
}

export function getRequestHost(h: Headers): string {
  const fromForwarded = firstCsv(h.get("x-forwarded-host"));
  if (fromForwarded) return fromForwarded;
  return firstCsv(h.get("host"));
}

export function getRequestProtocol(h: Headers): string {
  let p = firstCsv(h.get("x-forwarded-proto")) || "https";
  p = p.replace(/:+$/, "");
  return p;
}

/** Origin from request headers only (sanitized). */
export function getRequestOriginFromHeaders(h: Headers): string {
  const host = getRequestHost(h);
  if (!host) return "";
  return `${getRequestProtocol(h)}://${host}`;
}

/**
 * Prefer AUTH_URL / NEXTAUTH_URL so callbackUrl validation matches production
 * even when forwarded headers are noisy; fall back to sanitized request headers.
 */
export function getCanonicalRequestOrigin(h: Headers): string {
  const env = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (env?.trim()) {
    try {
      return new URL(env.trim()).origin;
    } catch {
      /* fall through */
    }
  }
  return getRequestOriginFromHeaders(h);
}
