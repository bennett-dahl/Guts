import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function RecipesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const recipes = await prisma.recipe.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      favorites: { where: { userId: session.user.id }, take: 1 },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Recipes</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Low-complexity meals and favorites.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/recipes/import"
            className="inline-flex min-h-11 items-center rounded-xl border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-600"
          >
            Import URL
          </Link>
          <Link
            href="/recipes/new"
            className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white"
          >
            New recipe
          </Link>
        </div>
      </div>
      <ul className="space-y-2">
        {recipes.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-600">
            No recipes yet. Add one or import from a URL.
          </li>
        ) : (
          recipes.map((r) => (
            <li key={r.id}>
              <Link
                href={`/recipes/${r.id}`}
                className="flex min-h-14 items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <span className="font-medium">{r.title}</span>
                <span className="flex items-center gap-2 text-xs text-zinc-500">
                  {r.favorites.length ? "★" : ""}
                  <span>D{r.difficulty}</span>
                  {r.activeTimeMin != null ? `${r.activeTimeMin}m` : ""}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
