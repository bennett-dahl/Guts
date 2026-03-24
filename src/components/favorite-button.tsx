"use client";

import { useTransition } from "react";
import { toggleFavorite } from "@/app/actions";

export function FavoriteButton({
  recipeId,
  favorited,
}: {
  recipeId: string;
  favorited: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="min-h-11 min-w-11 rounded-lg border border-zinc-300 text-lg dark:border-zinc-600"
      aria-label={favorited ? "Remove favorite" : "Add favorite"}
      onClick={() => start(() => toggleFavorite(recipeId))}
    >
      {favorited ? "★" : "☆"}
    </button>
  );
}
