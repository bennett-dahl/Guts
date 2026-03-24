import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { PrivateIpGoogleHint } from "@/components/private-ip-google-hint";
import { safePostLoginPath } from "@/lib/safe-post-login-path";

async function continueWithGoogle(formData: FormData) {
  "use server";
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";
  const raw = String(formData.get("redirectTo") ?? "").trim();
  const redirectTo = safePostLoginPath(raw.length > 0 ? raw : undefined, origin);
  await signIn("google", { redirectTo });
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";
  const afterLogin = safePostLoginPath(sp.callbackUrl, origin);

  if (session?.user) {
    redirect(afterLogin);
  }

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-600/20" />
        <div className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-600/15" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-lime-400/15 blur-3xl dark:bg-lime-500/10" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
              Guts
            </p>
            <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Welcome back
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Sign in to sync recipes, your meal planner, and shopping lists
              across your devices.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200/90 bg-white/90 p-6 shadow-lg shadow-zinc-900/[0.04] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-black/20 sm:p-8">
            <ul className="mb-6 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              {[
                "Plan meals by week and build smart grocery lists",
                "Track plant diversity and fiber-friendly habits",
                "Export or share lists to shop your way",
              ].map((text) => (
                <li key={text} className="flex gap-2.5">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="leading-snug">{text}</span>
                </li>
              ))}
            </ul>

            <form className="space-y-4" action={continueWithGoogle}>
              <input type="hidden" name="redirectTo" value={afterLogin} />
              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
              >
                <GoogleMark className="h-5 w-5" />
                Continue with Google
              </button>
            </form>

            {isDev ? (
              <p className="mt-5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Dev:
                </span>{" "}
                set{" "}
                <code className="rounded bg-zinc-200/80 px-1 font-mono text-[0.7rem] dark:bg-zinc-800">
                  AUTH_GOOGLE_ID
                </code>{" "}
                and{" "}
                <code className="rounded bg-zinc-200/80 px-1 font-mono text-[0.7rem] dark:bg-zinc-800">
                  AUTH_GOOGLE_SECRET
                </code>{" "}
                in{" "}
                <code className="rounded bg-zinc-200/80 px-1 font-mono text-[0.7rem] dark:bg-zinc-800">
                  .env
                </code>
                .
              </p>
            ) : null}

            <PrivateIpGoogleHint />

            <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
              Wellness software, not medical advice.
            </p>
          </div>

          <Link
            href="/"
            className="mt-8 block text-center text-sm font-medium text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
