import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfWeekMonday, addDays } from "@/lib/week";

function parseSettings(raw: string) {
  try {
    return JSON.parse(raw) as {
      plantWeeklyGoal?: number;
      fiberDailyGoal?: number;
    };
  } catch {
    return {};
  }
}

export default async function TrackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.idealDietProfile.findUnique({
    where: { userId: session.user.id },
  });
  const settings = profile ? parseSettings(profile.settings) : {};
  const goal = settings.plantWeeklyGoal ?? 30;

  const weekStart = startOfWeekMonday();
  const weekEnd = addDays(weekStart, 7);

  const logs = await prisma.mealCompletionLog.findMany({
    where: {
      userId: session.user.id,
      date: { gte: weekStart, lt: weekEnd },
    },
  });

  const plants = new Set<string>();
  for (const log of logs) {
    try {
      const arr = JSON.parse(log.plants) as unknown;
      if (Array.isArray(arr)) {
        for (const p of arr) {
          if (typeof p === "string" && p.trim()) plants.add(p.trim().toLowerCase());
        }
      }
    } catch {
      /* skip */
    }
  }

  const count = plants.size;
  const pct = Math.min(100, Math.round((count / Math.max(goal, 1)) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">This week</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Unique plants from meals you logged as cooked (heuristic from
          ingredients on each recipe).
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Plant diversity</p>
        <p className="mt-1 text-4xl font-bold text-emerald-700 dark:text-emerald-400">
          {count}
          <span className="text-lg font-normal text-zinc-500">
            {" "}
            / {goal}
          </span>
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Log meals from a recipe page with &quot;Log cooked&quot; to add plants.
          Fiber scoring can layer on USDA data later.
        </p>
      </div>
      {count > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-zinc-500">Plants so far</h2>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            {[...plants].sort().join(", ")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
