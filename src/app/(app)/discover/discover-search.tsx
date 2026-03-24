"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { queueSpoonacularRecipe } from "@/app/actions";

type Result = { id: number; title: string; image?: string; readyInMinutes?: number };

export function DiscoverSearch() {
  const router = useRouter();
  const [q, setQ] = useState("vegetarian");
  const [diet, setDiet] = useState("");
  const [maxTime, setMaxTime] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();

  async function search() {
    setErr(null);
    setLoading(true);
    try {
      const p = new URLSearchParams({ q });
      if (diet) p.set("diet", diet);
      if (maxTime) p.set("maxReadyTime", maxTime);
      const res = await fetch(`/api/recipes/search?${p}`);
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Search failed");
        setResults([]);
        return;
      }
      setResults(data.results ?? []);
    } catch {
      setErr("Network error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="min-h-11 flex-1 rounded-lg border border-zinc-300 px-3 dark:border-zinc-600 dark:bg-zinc-950"
        />
        <input
          value={diet}
          onChange={(e) => setDiet(e.target.value)}
          placeholder="Diet (e.g. vegan)"
          className="min-h-11 flex-1 rounded-lg border border-zinc-300 px-3 dark:border-zinc-600 dark:bg-zinc-950 sm:max-w-[160px]"
        />
        <input
          value={maxTime}
          onChange={(e) => setMaxTime(e.target.value)}
          placeholder="Max min"
          type="number"
          className="min-h-11 w-full rounded-lg border border-zinc-300 px-3 dark:border-zinc-600 dark:bg-zinc-950 sm:w-28"
        />
        <button
          type="button"
          onClick={() => search()}
          disabled={loading}
          className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "…" : "Search"}
        </button>
      </div>
      {err ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">{err}</p>
      ) : null}
      <ul className="space-y-2">
        {results.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
          >
            <div>
              <p className="font-medium">{r.title}</p>
              {r.readyInMinutes != null ? (
                <p className="text-xs text-zinc-500">{r.readyInMinutes} min</p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={pending}
              className="min-h-11 shrink-0 rounded-lg border border-zinc-300 px-3 text-sm dark:border-zinc-600"
              onClick={() =>
                start(async () => {
                  try {
                    await queueSpoonacularRecipe(r.id);
                    router.refresh();
                  } catch (e) {
                    alert(e instanceof Error ? e.message : "Queue failed");
                  }
                })
              }
            >
              Add to inbox
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
