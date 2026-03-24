import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { approveInboxItem, rejectInboxItem } from "@/app/actions";
import { getDiscoverSearchDefaults } from "@/lib/default-diet";
import { DiscoverSearch } from "./discover-search";
import type { ParsedRecipe } from "@/lib/recipe-import";

export default async function DiscoverPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const inbox = await prisma.recipeInbox.findMany({
    where: { userId: session.user.id, status: "pending" },
    orderBy: { createdAt: "desc" },
  });

  const profile = await prisma.idealDietProfile.findUnique({
    where: { userId: session.user.id },
    select: { settings: true },
  });
  const discoverDefaults = getDiscoverSearchDefaults(profile?.settings);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Discover</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Search Spoonacular’s catalog with filters, then{" "}
          <strong className="font-medium text-zinc-700 dark:text-zinc-300">
            add to inbox
          </strong>{" "}
          and approve recipes into your library. Default diet and search text
          are configurable under{" "}
          <Link
            href="/more"
            className="font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            More → Discover defaults
          </Link>
          . Identical searches are cached about an hour per account to save API
          points.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="sr-only">Recipe search</h2>
        <DiscoverSearch
          initialDiet={discoverDefaults.diet}
          initialQuery={discoverDefaults.query}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Inbox</h2>
        {inbox.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing waiting.</p>
        ) : (
          <ul className="space-y-3">
            {inbox.map((row) => {
              const payload = JSON.parse(row.payload) as ParsedRecipe;
              return (
                <li
                  key={row.id}
                  className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <p className="font-medium">{payload.title}</p>
                  <p className="text-xs text-zinc-500">{row.source}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={approveInboxItem.bind(null, row.id)}>
                      <button
                        type="submit"
                        className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white"
                      >
                        Approve to library
                      </button>
                    </form>
                    <form action={rejectInboxItem.bind(null, row.id)}>
                      <button
                        type="submit"
                        className="min-h-11 rounded-lg border border-zinc-300 px-4 text-sm dark:border-zinc-600"
                      >
                        Dismiss
                      </button>
                    </form>
                    {payload.sourceUrl ? (
                      <Link
                        href={payload.sourceUrl}
                        target="_blank"
                        className="inline-flex min-h-11 items-center text-sm text-emerald-700 underline dark:text-emerald-400"
                      >
                        Open source
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-center text-[11px] text-zinc-400">
        Recipe search and images via{" "}
        <a
          href="https://spoonacular.com/food-api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 underline dark:text-emerald-500"
        >
          Spoonacular
        </a>
        .
      </p>
    </div>
  );
}
