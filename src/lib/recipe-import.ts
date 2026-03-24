export type ParsedRecipe = {
  title: string;
  description?: string;
  imageUrl?: string;
  servings: number;
  instructions: string;
  ingredients: { name: string; quantity?: number; unit?: string }[];
  sourceUrl: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function pickRecipe(obj: unknown): Record<string, unknown> | null {
  const o = asRecord(obj);
  if (!o) return null;
  const t = o["@type"];
  const types = Array.isArray(t) ? t : t ? [t] : [];
  if (types.some((x) => x === "Recipe")) return o;
  return null;
}

function extractJsonLdBlocks(html: string): unknown[] {
  const results: unknown[] = [];
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[1]?.trim();
    if (!text) continue;
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) results.push(item);
      } else {
        results.push(parsed);
      }
    } catch {
      /* skip invalid JSON */
    }
  }
  return results;
}

function ingredientLine(ing: unknown): { name: string; quantity?: number; unit?: string } | null {
  if (typeof ing === "string") {
    const name = ing.trim();
    return name ? { name } : null;
  }
  const o = asRecord(ing);
  if (!o) return null;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name) return null;
  let quantity: number | undefined;
  let unit: string | undefined;
  if (typeof o.amount === "number") quantity = o.amount;
  else if (typeof o.amount === "string") {
    const n = parseFloat(o.amount);
    if (!Number.isNaN(n)) quantity = n;
  }
  if (typeof o.unit === "string") unit = o.unit;
  return { name, quantity, unit };
}

export async function importRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "GutsMealPlanner/1.0 (personal recipe import)",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Could not fetch page (${res.status})`);
  }
  const html = await res.text();
  const blocks = extractJsonLdBlocks(html);
  let recipeObj: Record<string, unknown> | null = null;
  for (const block of blocks) {
    const direct = pickRecipe(block);
    if (direct) {
      recipeObj = direct;
      break;
    }
    const o = asRecord(block);
    const graph = o?.["@graph"];
    if (Array.isArray(graph)) {
      for (const item of graph) {
        const r = pickRecipe(item);
        if (r) {
          recipeObj = r;
          break;
        }
      }
    }
    if (recipeObj) break;
  }
  if (!recipeObj) {
    throw new Error("No schema.org Recipe found on this page.");
  }

  const title =
    (typeof recipeObj.name === "string" && recipeObj.name) || "Imported recipe";
  const description =
    typeof recipeObj.description === "string" ? recipeObj.description : undefined;
  let imageUrl: string | undefined;
  const img = recipeObj.image;
  if (typeof img === "string") imageUrl = img;
  else if (Array.isArray(img) && typeof img[0] === "string") imageUrl = img[0];
  else if (asRecord(img)?.url && typeof asRecord(img)!.url === "string") {
    imageUrl = asRecord(img)!.url as string;
  }

  let servings = 4;
  const ry = recipeObj.recipeYield;
  if (typeof ry === "number") servings = Math.max(1, Math.round(ry));
  else if (typeof ry === "string") {
    const n = parseInt(ry.replace(/\D/g, ""), 10);
    if (!Number.isNaN(n) && n > 0) servings = n;
  }

  const ingRaw = recipeObj.recipeIngredient;
  const ingredients: { name: string; quantity?: number; unit?: string }[] = [];
  if (Array.isArray(ingRaw)) {
    for (const x of ingRaw) {
      const line = ingredientLine(x);
      if (line) ingredients.push(line);
    }
  } else if (typeof ingRaw === "string") {
    const line = ingredientLine(ingRaw);
    if (line) ingredients.push(line);
  }

  let instructions = "";
  const ri = recipeObj.recipeInstructions;
  if (typeof ri === "string") {
    instructions = ri;
  } else if (Array.isArray(ri)) {
    const parts: string[] = [];
    for (const step of ri) {
      const s = asRecord(step);
      const text =
        (s && typeof s.text === "string" && s.text) ||
        (typeof step === "string" ? step : "");
      if (text) parts.push(text.trim());
    }
    instructions = parts.join("\n\n");
  } else if (asRecord(ri)?.text && typeof asRecord(ri)!.text === "string") {
    instructions = asRecord(ri)!.text as string;
  }

  return {
    title,
    description,
    imageUrl,
    servings,
    instructions: instructions || "See source for steps.",
    ingredients,
    sourceUrl: url,
  };
}
