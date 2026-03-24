import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { PrivateIpGoogleHint } from "@/components/private-ip-google-hint";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  if (session?.user) {
    redirect(sp.callbackUrl ?? "/today");
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
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", {
              redirectTo: sp.callbackUrl ?? "/today",
            });
          }}
        >
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
