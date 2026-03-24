"use client";

import { useTransition } from "react";
import {
  getInstacartLinkForRecipe,
  getInstacartLinkForShoppingList,
} from "@/app/actions";

export function InstacartRecipeButton({ recipeId }: { recipeId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="min-h-12 w-full rounded-xl bg-[#003D29] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#002818] md:w-auto"
      disabled={pending}
      onClick={() => {
        start(async () => {
          try {
            const url = await getInstacartLinkForRecipe(recipeId);
            window.location.href = url;
          } catch (e) {
            alert(e instanceof Error ? e.message : "Instacart error");
          }
        });
      }}
    >
      {pending ? "Opening…" : "Continue in Instacart"}
    </button>
  );
}

export function InstacartListButton({ listId }: { listId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="min-h-12 w-full rounded-xl bg-[#003D29] px-4 py-3 text-sm font-semibold text-white hover:bg-[#002818] md:w-auto"
      disabled={pending}
      onClick={() => {
        start(async () => {
          try {
            const url = await getInstacartLinkForShoppingList(listId);
            window.location.href = url;
          } catch (e) {
            alert(e instanceof Error ? e.message : "Instacart error");
          }
        });
      }}
    >
      {pending ? "Opening…" : "Send list to Instacart"}
    </button>
  );
}
