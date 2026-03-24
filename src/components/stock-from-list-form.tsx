"use client";

import { useFormStatus } from "react-dom";
import { stockPantryFromShoppingList } from "@/app/pantry-actions";

function SubmitLabel() {
  const { pending } = useFormStatus();
  return pending ? "Updating…" : "Add purchases to stock";
}

export function StockFromListForm({ listId }: { listId: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
        Stock pantry after shopping
      </h2>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Adds list quantities to your inventory (merges by name + location).
        Check off items you bought, or add everything.
      </p>
      <form action={stockPantryFromShoppingList} className="mt-3 space-y-3">
        <input type="hidden" name="listId" value={listId} />
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Put items in
          <select
            name="location"
            className="mt-1 min-h-11 w-full max-w-xs rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="pantry">Pantry</option>
            <option value="fridge">Fridge</option>
            <option value="freezer">Freezer</option>
          </select>
        </label>
        <fieldset className="text-xs text-zinc-600 dark:text-zinc-400">
          <legend className="font-medium">Which lines</legend>
          <label className="mt-2 flex items-center gap-2">
            <input type="radio" name="mode" value="checked" defaultChecked />
            Checked items only (recommended)
          </label>
          <label className="mt-1 flex items-center gap-2">
            <input type="radio" name="mode" value="all" />
            All lines on this list
          </label>
        </fieldset>
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          <SubmitLabel />
        </button>
      </form>
    </div>
  );
}
