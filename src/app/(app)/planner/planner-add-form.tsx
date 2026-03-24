"use client";

import { useRef } from "react";
import { addPlannedMeal } from "@/app/actions";

const SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;

export function PlannerAddForm({
  mealPlanId,
  dateIso,
  recipes,
}: {
  mealPlanId: string;
  dateIso: string;
  recipes: { id: string; title: string }[];
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        const recipeId = String(fd.get("recipeId") ?? "");
        const slot = String(fd.get("slot") ?? "dinner");
        if (!recipeId) return;
        await addPlannedMeal({
          mealPlanId,
          dateIso,
          slot,
          recipeId,
        });
        ref.current?.reset();
      }}
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <label className="block text-xs text-zinc-500">
        Slot
        <select
          name="slot"
          className="mt-0.5 block w-full min-h-11 rounded-lg border border-zinc-300 px-2 dark:border-zinc-600 dark:bg-zinc-950"
        >
          {SLOTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0 flex-1 text-xs text-zinc-500">
        Recipe
        <select
          name="recipeId"
          required
          className="mt-0.5 block w-full min-h-11 rounded-lg border border-zinc-300 px-2 dark:border-zinc-600 dark:bg-zinc-950"
        >
          <option value="">Choose…</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="min-h-11 rounded-lg bg-zinc-200 px-4 text-sm font-medium dark:bg-zinc-800"
      >
        Add
      </button>
    </form>
  );
}
