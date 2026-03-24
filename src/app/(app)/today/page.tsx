import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.onboardingDone) {
    redirect("/onboarding");
  }

  const [recipeCount, listCount, pendingInbox] = await Promise.all([
    prisma.recipe.count({ where: { userId: session.user.id } }),
    prisma.shoppingList.count({ where: { userId: session.user.id } }),
    prisma.recipeInbox.count({
      where: { userId: session.user.id, status: "pending" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Today</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Quick access to planning and shopping.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/recipes"
          className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <p className="text-sm font-medium text-zinc-500">Recipes</p>
          <p className="text-2xl font-bold">{recipeCount}</p>
        </Link>
        <Link
          href="/shop"
          className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <p className="text-sm font-medium text-zinc-500">Shopping lists</p>
          <p className="text-2xl font-bold">{listCount}</p>
        </Link>
        <Link
          href="/discover"
          className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <p className="text-sm font-medium text-zinc-500">Inbox to review</p>
          <p className="text-2xl font-bold">{pendingInbox}</p>
        </Link>
        <Link
          href="/track"
          className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <p className="text-sm font-medium text-zinc-500">Weekly plants</p>
          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
            View progress
          </p>
        </Link>
      </ul>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/planner"
          className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white"
        >
          Meal planner
        </Link>
        <Link
          href="/recipes/new"
          className="inline-flex min-h-11 items-center rounded-xl border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-600"
        >
          Add recipe
        </Link>
      </div>
    </div>
  );
}
