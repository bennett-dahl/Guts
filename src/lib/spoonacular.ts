const BASE = "https://api.spoonacular.com";

export type SpoonacularSearchResult = {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
};

export type SpoonacularSearchResponse = {
  results: SpoonacularSearchResult[];
  totalResults: number;
};

export async function spoonacularSearch(params: {
  query?: string;
  diet?: string;
  maxReadyTime?: number;
  number?: number;
  offset?: number;
  cuisine?: string;
  intolerances?: string[];
  type?: string;
  sort?: string;
  /** Comma-joined in API — pantry names to bias results */
  includeIngredients?: string[];
}): Promise<SpoonacularSearchResponse> {
  const key = process.env.SPOONACULAR_API_KEY;
  if (!key) {
    throw new Error("SPOONACULAR_API_KEY is not configured.");
  }
  const n = new URLSearchParams();
  n.set("apiKey", key);
  const q = params.query?.trim();
  n.set("query", q && q.length > 0 ? q : "healthy");
  n.set("number", String(params.number ?? 12));
  n.set("offset", String(params.offset ?? 0));
  n.set("addRecipeInformation", "true");
  if (params.diet) n.set("diet", params.diet);
  if (params.maxReadyTime != null && params.maxReadyTime > 0) {
    n.set("maxReadyTime", String(params.maxReadyTime));
  }
  if (params.cuisine) n.set("cuisine", params.cuisine);
  if (params.intolerances?.length) {
    n.set("intolerances", params.intolerances.join(","));
  }
  if (params.type) n.set("type", params.type);
  if (params.sort) n.set("sort", params.sort);
  if (params.includeIngredients?.length) {
    n.set(
      "includeIngredients",
      params.includeIngredients.slice(0, 8).join(","),
    );
  }

  const url = `${BASE}/recipes/complexSearch?${n.toString()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Spoonacular ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    results?: SpoonacularSearchResult[];
    totalResults?: number;
  };
  return {
    results: data.results ?? [],
    totalResults: data.totalResults ?? 0,
  };
}

export type SpoonacularRecipeInfo = {
  id: number;
  title: string;
  image?: string;
  servings?: number;
  readyInMinutes?: number;
  summary?: string;
  instructions?: string;
  extendedIngredients?: {
    name: string;
    original?: string;
    amount?: number;
    unit?: string;
  }[];
};

export async function spoonacularRecipeInformation(id: number) {
  const key = process.env.SPOONACULAR_API_KEY;
  if (!key) {
    throw new Error("SPOONACULAR_API_KEY is not configured.");
  }
  const url = `${BASE}/recipes/${id}/information?includeNutrition=false&apiKey=${encodeURIComponent(key)}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Spoonacular ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json() as Promise<SpoonacularRecipeInfo>;
}

export type SpoonacularByIngredientResult = {
  id: number;
  title: string;
  image?: string;
  usedIngredientCount?: number;
  missedIngredientCount?: number;
};

export async function spoonacularFindByIngredients(
  ingredientNames: string[],
  opts?: { number?: number; ranking?: number },
): Promise<SpoonacularByIngredientResult[]> {
  const key = process.env.SPOONACULAR_API_KEY;
  if (!key) {
    throw new Error("SPOONACULAR_API_KEY is not configured.");
  }
  const cleaned = ingredientNames
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (cleaned.length === 0) return [];

  const n = new URLSearchParams();
  n.set("apiKey", key);
  n.set("ingredients", cleaned.join(","));
  n.set("number", String(opts?.number ?? 12));
  n.set("ranking", String(opts?.ranking ?? 2));
  n.set("ignorePantry", "true");

  const url = `${BASE}/recipes/findByIngredients?${n.toString()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Spoonacular ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as SpoonacularByIngredientResult[];
  return Array.isArray(data) ? data : [];
}

export function toParsedRecipe(
  info: SpoonacularRecipeInfo,
): import("@/lib/recipe-import").ParsedRecipe {
  const ingredients =
    info.extendedIngredients?.map((e) => ({
      name: e.original || e.name,
      quantity: e.amount,
      unit: e.unit || undefined,
    })) ?? [];
  return {
    title: info.title,
    description: stripHtml(info.summary ?? ""),
    imageUrl: info.image,
    servings: info.servings ?? 4,
    instructions: stripHtml(info.instructions ?? "See Spoonacular for full steps."),
    ingredients,
    sourceUrl: `https://spoonacular.com/recipes/${slugify(info.title)}-${info.id}`,
  };
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
