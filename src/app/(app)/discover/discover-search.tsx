"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { queueSpoonacularRecipe } from "@/app/actions";
import {
  CUISINE_OPTIONS,
  DIET_SELECT_GROUPS,
  INTOLERANCE_OPTIONS,
  MAX_TIME_OPTIONS,
  SORT_OPTIONS,
  TYPE_OPTIONS,
  type IntoleranceId,
} from "@/lib/spoonacular-filters";

type Result = {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
};

const PAGE_SIZE = 12;

export function DiscoverSearch({
  initialDiet,
  initialQuery,
}: {
  initialDiet: string;
  initialQuery: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [diet, setDiet] = useState(initialDiet);
  const [cuisine, setCuisine] = useState("");
  const [courseType, setCourseType] = useState("");
  const [sort, setSort] = useState("popularity");
  const [maxTime, setMaxTime] = useState("");
  const [intolerances, setIntolerances] = useState<Set<IntoleranceId>>(
    new Set(),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [results, setResults] = useState<Result[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pending, start] = useTransition();
  const [queueingId, setQueueingId] = useState<number | null>(null);

  const buildParams = useCallback(
    (offset: number) => {
      const p = new URLSearchParams();
      if (q.trim()) p.set("q", q.trim());
      if (diet) p.set("diet", diet);
      if (cuisine) p.set("cuisine", cuisine);
      if (courseType) p.set("type", courseType);
      if (sort) p.set("sort", sort);
      if (maxTime) p.set("maxReadyTime", maxTime);
      if (intolerances.size > 0) {
        p.set("intolerances", [...intolerances].sort().join(","));
      }
      p.set("offset", String(offset));
      p.set("number", String(PAGE_SIZE));
      return p;
    },
    [q, diet, cuisine, courseType, sort, maxTime, intolerances],
  );

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      setErr(null);
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await fetch(
          `/api/recipes/search?${buildParams(offset).toString()}`,
        );
        const data = (await res.json()) as {
          results?: Result[];
          totalResults?: number;
          error?: string;
        };
        if (!res.ok) {
          setErr(data.error ?? "Search failed");
          if (!append) setResults([]);
          return;
        }
        const next = data.results ?? [];
        setTotalResults(data.totalResults ?? 0);
        if (append) {
          setResults((prev) => [...prev, ...next]);
        } else {
          setResults(next);
        }
      } catch {
        setErr("Network error");
        if (!append) setResults([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildParams],
  );

  const runSearch = useCallback(() => {
    setHasSearched(true);
    void fetchPage(0, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (results.length >= totalResults || loadingMore) return;
    void fetchPage(results.length, true);
  }, [fetchPage, results.length, totalResults, loadingMore]);

  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  // One automatic search on mount (uses latest fetchPage via ref). React Strict
  // Mode in dev may run this twice; server-side search cache limits duplicate cost.
  useLayoutEffect(() => {
    setHasSearched(true);
    void fetchPageRef.current(0, false);
  }, []);

  function toggleIntolerance(id: IntoleranceId) {
    setIntolerances((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasMore = results.length > 0 && results.length < totalResults;

  return (
    <div className="space-y-6">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <label className="sr-only" htmlFor="discover-q">
            Search recipes
          </label>
          <input
            id="discover-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ingredients or dish — e.g. salmon, lentil soup…"
            className="min-h-12 flex-1 rounded-2xl border border-zinc-300 bg-white px-4 text-base shadow-sm outline-none ring-emerald-700/20 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-950 dark:focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 shrink-0 rounded-2xl bg-emerald-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50 sm:px-8"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex min-h-11 w-full items-center justify-between rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 sm:w-auto"
          aria-expanded={filtersOpen}
        >
          <span>Filters</span>
          <span className="text-zinc-400" aria-hidden>
            {filtersOpen ? "▴" : "▾"}
          </span>
        </button>

        {filtersOpen ? (
          <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Diet
              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              >
                <option value="">Any diet (plants, fish, meat)</option>
                {DIET_SELECT_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Max active time
              <select
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              >
                {MAX_TIME_OPTIONS.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Sort by
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Cuisine
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              >
                {CUISINE_OPTIONS.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Course
              <select
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Exclude (intolerances)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTOLERANCE_OPTIONS.map(({ id, label }) => {
                  const on = intolerances.has(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleIntolerance(id)}
                      className={`min-h-9 rounded-full border px-3 py-1 text-xs font-medium transition ${
                        on
                          ? "border-emerald-600 bg-emerald-100 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200"
                          : "border-zinc-300 bg-white text-zinc-600 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-400"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </form>

      {err ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          role="alert"
        >
          {err}
        </div>
      ) : null}

      {!loading && hasSearched && results.length === 0 && !err ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-600">
          No recipes matched. Try a different search or loosen filters.
        </p>
      ) : null}

      {loading && results.length === 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="aspect-[312/231] animate-pulse bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-2 p-4">
                <div className="h-4 max-w-[220px] animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-9 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {results.map((r) => (
            <li
              key={r.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="relative aspect-[312/231] w-full bg-zinc-100 dark:bg-zinc-900">
                {r.image ? (
                  <Image
                    src={r.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                  {r.title}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {r.readyInMinutes != null ? `${r.readyInMinutes} min` : "—"}
                  {r.servings != null ? ` · ${r.servings} servings` : ""}
                </p>
                <button
                  type="button"
                  disabled={pending && queueingId === r.id}
                  className="mt-3 min-h-11 w-full rounded-xl border border-emerald-700/40 bg-emerald-50 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-600/40 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-950"
                  onClick={() =>
                    start(async () => {
                      setQueueingId(r.id);
                      try {
                        await queueSpoonacularRecipe(r.id);
                        router.refresh();
                      } catch (e) {
                        alert(
                          e instanceof Error ? e.message : "Could not queue",
                        );
                      } finally {
                        setQueueingId(null);
                      }
                    })
                  }
                >
                  {queueingId === r.id ? "Adding…" : "Add to inbox"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={loadMore}
            className="min-h-12 rounded-2xl border border-zinc-300 px-8 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            {loadingMore ? "Loading…" : `Load more (${results.length} of ${totalResults})`}
          </button>
        </div>
      ) : null}

      {hasSearched && totalResults > 0 ? (
        <p className="text-center text-xs text-zinc-500">
          {totalResults} recipe{totalResults === 1 ? "" : "s"} from Spoonacular
          · results cached ~1h per query
        </p>
      ) : null}
    </div>
  );
}
