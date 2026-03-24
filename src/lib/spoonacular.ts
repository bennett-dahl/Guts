const BASE = "https://api.spoonacular.com";

export type SpoonacularSearchResult = {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
};

export async function spoonacularSearch(params: {
  query: string;
  diet?: string;
  maxReadyTime?: number;
  number?: number;
}) {
  const key = process.env.SPOONACULAR_API_KEY;
  if (!key) {
    throw new Error("SPOONACULAR_API_KEY is not configured.");
  }
  const n = new URLSearchParams();
  n.set("apiKey", key);
  n.set("query", params.query || "healthy");
  n.set("number", String(params.number ?? 12));
  n.set("addRecipeInformation", "false");
  if (params.diet) n.set("diet", params.diet);
  if (params.maxReadyTime != null) {
    n.set("maxReadyTime", String(params.maxReadyTime));
  }
  const url = `${BASE}/recipes/complexSearch?${n.toString()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Spoonacular ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    results: SpoonacularSearchResult[];
  };
  return data.results ?? [];
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
