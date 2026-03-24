import { guessCategory } from "./shop-category";

const LEGUME = /\b(lentil|bean|chickpea|black bean|kidney bean|pinto|navy bean|edamame|pea|split pea)\b/i;

/** Derive plant diversity tokens from ingredient lines (heuristic). */
export function plantsFromIngredientNames(names: string[]): string[] {
  const out = new Set<string>();
  for (const raw of names) {
    const n = raw.trim();
    if (!n) continue;
    const cat = guessCategory(n);
    if (cat === "Produce") {
      out.add(normalizePlantToken(n));
    } else if (LEGUME.test(n)) {
      out.add(normalizePlantToken(n));
    }
  }
  return [...out];
}

function normalizePlantToken(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^\d+(\.\d+)?\s*/, "")
    .slice(0, 80);
}
