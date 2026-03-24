import Link from "next/link";
import { importRecipeFromUrlAction } from "@/app/actions";

export default function ImportRecipePage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/recipes"
          className="text-sm text-emerald-700 dark:text-emerald-400"
        >
          ← Recipes
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Import from URL</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          We read <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">schema.org</code>{" "}
          Recipe JSON-LD when the site exposes it.
        </p>
      </div>
      <form
        action={async (fd) => {
          "use server";
          const url = String(fd.get("url") ?? "").trim();
          if (!url) return;
          await importRecipeFromUrlAction(url);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium">Recipe page URL</label>
          <input
            name="url"
            type="url"
            required
            placeholder="https://"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <button
          type="submit"
          className="min-h-12 w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white"
        >
          Import
        </button>
      </form>
    </div>
  );
}
