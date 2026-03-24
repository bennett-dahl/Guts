import { headers } from "next/headers";

function privateLanHostname(hostHeader: string): string | null {
  const hostname = hostHeader.split(":")[0]?.trim() ?? "";
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return hostname;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return hostname;
  const m = /^172\.(\d{1,3})\./.exec(hostname);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 16 && n <= 31) return hostname;
  }
  return null;
}

function toNipHost(hostname: string) {
  return `${hostname.replace(/\./g, "-")}.nip.io`;
}

/** Google OAuth rejects redirect URIs on bare 192.168/10/172.16-31 addresses. */
export async function PrivateIpGoogleHint() {
  if (process.env.NODE_ENV !== "development") return null;

  const h = await headers();
  const forwarded = h.get("x-forwarded-host");
  const host =
    forwarded?.split(",")[0]?.trim() ?? h.get("host") ?? "";
  const ip = privateLanHostname(host);
  if (!ip) return null;

  const nip = toNipHost(ip);

  return (
    <aside
      className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
      role="status"
    >
      <p className="font-medium">Google sign-in and private IPs</p>
      <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
        You opened this page using a LAN address ({ip}). Google blocks OAuth for
        that URL. Use{" "}
        <code className="rounded bg-amber-100/80 px-1 text-xs dark:bg-amber-900/80">
          http://localhost:3000
        </code>{" "}
        on this computer, or open{" "}
        <code className="rounded bg-amber-100/80 px-1 text-xs dark:bg-amber-900/80">
          http://{nip}:3000
        </code>{" "}
        and add that origin +{" "}
        <code className="rounded bg-amber-100/80 px-1 text-xs dark:bg-amber-900/80">
          …/api/auth/callback/google
        </code>{" "}
        in Google Cloud. Details:{" "}
        <strong>setupInstructions.md §4.4</strong>.
      </p>
    </aside>
  );
}
