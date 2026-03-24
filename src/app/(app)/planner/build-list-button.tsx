"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buildShoppingListFromPlan } from "@/app/actions";

export function BuildListButton({ mealPlanId }: { mealPlanId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white md:w-auto"
      onClick={() => {
        start(async () => {
          const id = await buildShoppingListFromPlan(mealPlanId);
          router.push(`/shop/${id}`);
        });
      }}
    >
      {pending ? "Building…" : "Build shopping list from this week"}
    </button>
  );
}
