"use client";

import { useTransition } from "react";
import { logMealCooked } from "@/app/actions";

export function LogCookedButton({ recipeId }: { recipeId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="min-h-11 rounded-lg border border-emerald-600 px-4 text-sm font-medium text-emerald-800 dark:text-emerald-300"
      onClick={() => start(() => logMealCooked(recipeId))}
    >
      {pending ? "…" : "Log cooked (plants & pantry)"}
    </button>
  );
}
