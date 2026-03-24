/** Normalize ingredient / pantry names for fuzzy matching. */
export function normalizePantryName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,;'"()[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function significantTokens(s: string): string[] {
  const stop = new Set([
    "a",
    "an",
    "the",
    "of",
    "and",
    "or",
    "to",
    "fresh",
    "dried",
    "chopped",
    "sliced",
    "minced",
    "whole",
    "large",
    "small",
    "medium",
  ]);
  return normalizePantryName(s)
    .split(" ")
    .filter((t) => t.length > 1 && !stop.has(t));
}
