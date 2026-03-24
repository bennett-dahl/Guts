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

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Use your Google account. Configure{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
            AUTH_GOOGLE_ID
          </code>{" "}
          and{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
            AUTH_GOOGLE_SECRET
          </code>{" "}
          in{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
            .env
          </code>
          .
        </p>
        <PrivateIpGoogleHint />
        <form className="mt-8" action={continueWithGoogle}>
          <input type="hidden" name="redirectTo" value={afterLogin} />
          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-300 bg-white text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Continue with Google
          </button>
        </form>
        <Link
          href="/"
          className="mt-6 block text-center text-sm text-emerald-700 dark:text-emerald-400"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
