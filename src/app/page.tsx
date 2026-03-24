import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/today");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-6 py-16">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Guts
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Eat more plants with less friction
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Plan simple meals, export shopping lists, and nudge toward fiber and
          diversity — built for phone and tablet.
        </p>
        <Link
          href="/login"
          className="mt-10 inline-flex min-h-12 min-w-[200px] items-center justify-center rounded-xl bg-emerald-700 px-6 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Sign in with Google
        </Link>
        <p className="mt-8 text-xs text-zinc-500">
          Wellness software, not medical advice. Not affiliated with Dr.
          Will Bulsiewicz.
        </p>
      </div>
    </div>
  );
}
