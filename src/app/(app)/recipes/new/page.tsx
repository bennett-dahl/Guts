import Link from "next/link";
import { createRecipeManual } from "@/app/actions";

export default function NewRecipePage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/recipes"
          className="text-sm text-emerald-700 dark:text-emerald-400"
        >
          ← Recipes
        </Link>
        <h1 className="mt-2 text-2xl font-bold">New recipe</h1>
      </div>
      <form action={createRecipeManual} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            name="title"
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <input
            name="description"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Servings</label>
            <input
              name="servings"
              type="number"
              min={1}
              defaultValue={4}
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Difficulty 1–3</label>
            <input
              name="difficulty"
              type="number"
              min={1}
              max={3}
              defaultValue={2}
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Active time (minutes)</label>
          <input
            name="activeTimeMin"
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Tags (comma-separated)</label>
          <input
            name="tags"
            placeholder="one-pot, vegan, batch"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Ingredients (one per line)
          </label>
          <textarea
            name="ingredientsText"
            required
            rows={6}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Instructions</label>
          <textarea
            name="instructions"
            required
            rows={8}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <button
          type="submit"
          className="min-h-12 w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white"
        >
          Save recipe
        </button>
      </form>
    </div>
  );
}
