"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { queueSpoonacularRecipe } from "@/app/actions";
import {
  suggestFromPantry,
  type SuggestFromPantryResult,
} from "@/app/pantry-actions";
import type { CookMealFocus } from "@/lib/cook-intent";

const MEALS: { id: CookMealFocus; label: string }[] = [
  { id: "", label: "Any meal" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Quick snack" },
];

export function CookFromHome() {
  const router = useRouter();
  const [hint, setHint] = useState("");
  const [meal, setMeal] = useState<CookMealFocus>("");
  const [data, setData] = useState<SuggestFromPantryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();
  const [queueKey, setQueueKey] = useState<string | null>(null);

  async function runSuggest() {
    setLoading(true);
    try {
      const r = await suggestFromPantry(hint, meal);
      setData(r);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
        <label className="block text-xs font-medium text-zinc-500">
          What do you want?
          <textarea
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            rows={2}
            placeholder='e.g. "quick snack", "something with eggs", "easy dinner"'
            className="mt-2 min-h-[88px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <p className="mt-2 text-xs text-zinc-500">Meal type</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {MEALS.map((m) => (
            <button
              key={m.id || "any"}
              type="button"
              onClick={() => setMeal(m.id)}
              className={`min-h-10 rounded-full border px-3 text-sm font-medium ${
                meal === m.id
                  ? "border-emerald-600 bg-emerald-100 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-100"
                  : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-950"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void runSuggest()}
          className="mt-4 min-h-11 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {loading ? "Finding ideas…" : "Suggest recipes"}
        </button>
      </div>

      {data?.spoonacularError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Spoonacular: {data.spoonacularError} — your library matches still
          work.
        </p>
      ) : null}

      {data && data.pantryItemCount === 0 ? (
        <p className="text-sm text-zinc-500">
          Add a few staples under{" "}
          <Link href="/pantry" className="text-emerald-700 underline dark:text-emerald-400">
            Pantry
          </Link>{" "}
          for better suggestions.
        </p>
      ) : null}

      {data && data.lowStock.length > 0 ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Running low
          </p>
          <ul className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            {data.lowStock.map((p) => (
              <li key={p.id}>
                {p.name} ({p.location}, qty {p.quantity})
              </li>
            ))}
          </ul>
          <Link
            href="/shop"
            className="mt-2 inline-block text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            Plan a shop →
          </Link>
        </div>
      ) : null}

      {data && data.local.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">From your library</h2>
          <ul className="space-y-2">
            {data.local.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/recipes/${r.id}`}
                  className="flex min-h-11 items-center justify-between rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <span>{r.title}</span>
                  <span className="text-xs text-zinc-500">
                    ~{Math.round(r.score * 100)}% match
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data && data.byIngredients.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Uses your ingredients</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.byIngredients.map((r) => (
              <li
                key={r.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="relative aspect-[312/231] bg-zinc-100 dark:bg-zinc-900">
                  {r.image ? (
                    <Image
                      src={r.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-zinc-500">
                    {r.usedIngredientCount ?? "?"} in stock ·{" "}
                    {r.missedIngredientCount ?? "?"} missing
                  </p>
                  <button
                    type="button"
                    disabled={pending && queueKey === `bi-${r.id}`}
                    className="mt-2 min-h-10 w-full rounded-lg border border-emerald-700/40 text-sm font-semibold text-emerald-800 dark:text-emerald-200"
                    onClick={() =>
                      start(async () => {
                        setQueueKey(`bi-${r.id}`);
                        try {
                          await queueSpoonacularRecipe(r.id);
                          router.refresh();
                        } catch (e) {
                          alert(
                            e instanceof Error ? e.message : "Could not queue",
                          );
                        } finally {
                          setQueueKey(null);
                        }
                      })
                    }
                  >
                    {queueKey === `bi-${r.id}` ? "…" : "Add to inbox"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data && data.search.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">More ideas (catalog)</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.search.map((r) => (
              <li
                key={r.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="relative aspect-[312/231] bg-zinc-100 dark:bg-zinc-900">
                  {r.image ? (
                    <Image
                      src={r.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium">{r.title}</p>
                  <button
                    type="button"
                    disabled={pending && queueKey === `sr-${r.id}`}
                    className="mt-2 min-h-10 w-full rounded-lg border border-zinc-300 text-sm dark:border-zinc-600"
                    onClick={() =>
                      start(async () => {
                        setQueueKey(`sr-${r.id}`);
                        try {
                          await queueSpoonacularRecipe(r.id);
                          router.refresh();
                        } catch (e) {
                          alert(
                            e instanceof Error ? e.message : "Could not queue",
                          );
                        } finally {
                          setQueueKey(null);
                        }
                      })
                    }
                  >
                    {queueKey === `sr-${r.id}` ? "…" : "Add to inbox"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
