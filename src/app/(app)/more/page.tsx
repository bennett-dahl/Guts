import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateDiscoverSearchDefaults } from "@/app/actions";
import { getDiscoverSearchDefaults } from "@/lib/default-diet";
import { DIET_OPTIONS } from "@/lib/spoonacular-filters";

export default async function MorePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, onboardingDone: true },
  });

  const profile = await prisma.idealDietProfile.findUnique({
    where: { userId: session.user.id },
    select: { settings: true },
  });
  const discoverDefaults = getDiscoverSearchDefaults(profile?.settings);

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
            href="/pantry"
            className="block min-h-11 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            Pantry & fridge (stock)
          </Link>
        </li>
        <li>
          <Link
            href="/cook"
            className="block min-h-11 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            Cook from what you have
          </Link>
        </li>
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

      <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Discover defaults
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Used when you open <strong className="font-medium">Find</strong>{" "}
          (Spoonacular search). Change anytime.
        </p>
        <form action={updateDiscoverSearchDefaults} className="mt-4 space-y-3">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Default diet filter
            <select
              name="discoverDefaultDiet"
              defaultValue={discoverDefaults.diet}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            >
              {DIET_OPTIONS.map((o) => (
                <option key={o.value || "any"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Default search text
            <input
              type="text"
              name="discoverDefaultQuery"
              defaultValue={discoverDefaults.query}
              placeholder="e.g. vegetables, salmon, sheet pan"
              maxLength={120}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <p className="text-xs text-zinc-500">
            Clear the text field and save for the broadest results (no keyword
            bias). Plant-leaning preset in new accounts is{" "}
            <code className="rounded bg-zinc-100 px-1 text-[0.7rem] dark:bg-zinc-800">
              vegetables
            </code>
            .
          </p>
          <button
            type="submit"
            className="min-h-11 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Save discover defaults
          </button>
        </form>
      </div>

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
        Shopping lists: copy, share, or PDF from the Shop tab — no grocery API
        keys required.
      </p>
    </div>
  );
}
