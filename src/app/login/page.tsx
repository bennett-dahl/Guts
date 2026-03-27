import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { PrivateIpGoogleHint } from "@/components/private-ip-google-hint";
import { getCanonicalRequestOrigin } from "@/lib/request-origin";
import { safePostLoginPath } from "@/lib/safe-post-login-path";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  const h = await headers();
  const origin = getCanonicalRequestOrigin(h);
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

            <div className="space-y-4">
              <GoogleSignInButton callbackUrl={afterLogin} />
            </div>

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
