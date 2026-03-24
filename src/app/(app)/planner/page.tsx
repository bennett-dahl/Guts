import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateWeekPlan, removePlannedMeal } from "@/app/actions";
import { addDays, startOfWeekMonday, toISODate } from "@/lib/week";
import { PlannerAddForm } from "./planner-add-form";
import { BuildListButton } from "./build-list-button";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sp = await searchParams;
  const monday = sp.w
    ? new Date(sp.w + "T12:00:00")
    : startOfWeekMonday();
  if (sp.w && Number.isNaN(monday.getTime())) {
    redirect("/planner");
  }
  const mondayNorm = startOfWeekMonday(monday);

  const plan = await getOrCreateWeekPlan(mondayNorm.toISOString());
  const recipes = await prisma.recipe.findMany({
    where: { userId: session.user.id },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  const prevWeek = toISODate(addDays(mondayNorm, -7));
  const nextWeek = toISODate(addDays(mondayNorm, 7));

  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(mondayNorm, i));

  const mealsByDay = new Map<string, typeof plan.meals>();
  for (const d of days) {
    mealsByDay.set(toISODate(d), []);
  }
  for (const m of plan.meals) {
    const key = toISODate(m.date);
    const list = mealsByDay.get(key);
    if (list) list.push(m);
    else mealsByDay.set(key, [m]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Meal planner</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Week of {mondayNorm.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/planner?w=${prevWeek}`}
            className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600"
          >
            Prev
          </Link>
          <Link
            href={`/planner?w=${nextWeek}`}
            className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600"
          >
            Next
          </Link>
        </div>
      </div>

      <BuildListButton mealPlanId={plan.id} />

      <div className="space-y-4">
        {days.map((d) => {
          const key = toISODate(d);
          const meals = mealsByDay.get(key) ?? [];
          return (
            <section
              key={key}
              className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <h2 className="font-semibold">
                {d.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h2>
              <ul className="mt-2 space-y-2">
                {meals.length === 0 ? (
                  <li className="text-sm text-zinc-500">No meals</li>
                ) : (
                  meals.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span>
                        <span className="text-zinc-500">{m.slot}:</span>{" "}
                        {m.recipe?.title ?? "—"}
                      </span>
                      <form action={removePlannedMeal.bind(null, m.id)}>
                        <button
                          type="submit"
                          className="text-xs text-red-600 dark:text-red-400"
                        >
                          Remove
                        </button>
                      </form>
                    </li>
                  ))
                )}
              </ul>
              <div className="mt-3">
                <PlannerAddForm
                  mealPlanId={plan.id}
                  dateIso={`${key}T12:00:00`}
                  recipes={recipes}
                />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
