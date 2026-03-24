import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function MorePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, onboardingDone: true },
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">More</h1>
      <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Signed in</p>
        <p className="font-medium">{user?.email ?? session.user?.email}</p>
      </div>
      <ul className="space-y-2 text-sm">
        <li>
          <Link
            href="/onboarding"
            className="block min-h-11 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            Review gut-health intro & PDF links
          </Link>
        </li>
        {!user?.onboardingDone ? (
          <li className="text-amber-700 dark:text-amber-400">
            Finish onboarding for the full disclaimer and defaults.
          </li>
        ) : null}
      </ul>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="min-h-12 w-full rounded-xl border border-zinc-300 py-3 text-sm font-medium dark:border-zinc-600"
        >
          Sign out
        </button>
      </form>
      <p className="text-xs text-zinc-500">
        Instacart production keys and Impact affiliate require Instacart review.
        Set <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">INSTACART_API_KEY</code>{" "}
        for Developer Platform (dev host in{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">INSTACART_API_BASE</code>
        ).
      </p>
    </div>
  );
}
