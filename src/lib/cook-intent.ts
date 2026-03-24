export type CookMealFocus =
  | ""
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack";

export type CookIntentResolved = {
  /** Extra words for Spoonacular `query` */
  queryBoost: string;
  /** Spoonacular `type` when applicable */
  recipeType?: string;
  maxReadyTime?: number;
};

const SNACK_WORDS = /\b(snack|quick bite|nibble|something small)\b/i;
const QUICK_WORDS = /\b(quick|fast|easy|15 min|20 min|no cook)\b/i;
const BREAKFAST_WORDS = /\b(breakfast|morning|brunch)\b/i;
const LUNCH_WORDS = /\b(lunch|midday)\b/i;
const DINNER_WORDS = /\b(dinner|supper|evening meal)\b/i;

/**
 * Combine free-text hint + meal focus into search parameters.
 */
export function resolveCookIntent(
  hint: string,
  mealFocus: CookMealFocus,
): CookIntentResolved {
  const h = hint.trim();
  let recipeType: string | undefined;
  let maxReadyTime: number | undefined;
  let queryBoost = "";

  if (mealFocus === "breakfast") recipeType = "breakfast";
  else if (mealFocus === "lunch") recipeType = "main course";
  else if (mealFocus === "dinner") recipeType = "main course";
  else if (mealFocus === "snack") recipeType = "snack";

  if (SNACK_WORDS.test(h) || mealFocus === "snack") {
    recipeType = "snack";
    queryBoost = "snack";
  }
  if (BREAKFAST_WORDS.test(h)) {
    recipeType = "breakfast";
    queryBoost = queryBoost ? `${queryBoost} breakfast` : "breakfast";
  }
  if (LUNCH_WORDS.test(h)) {
    recipeType = recipeType ?? "main course";
    queryBoost = queryBoost ? `${queryBoost} lunch` : "lunch";
  }
  if (DINNER_WORDS.test(h)) {
    recipeType = recipeType ?? "main course";
    queryBoost = queryBoost ? `${queryBoost} dinner` : "dinner";
  }
  if (QUICK_WORDS.test(h) || mealFocus === "snack") {
    maxReadyTime = maxReadyTime ?? 25;
  }

  if (h.length > 0) {
    const stripped = h
      .replace(SNACK_WORDS, "")
      .replace(QUICK_WORDS, "")
      .replace(BREAKFAST_WORDS, "")
      .replace(LUNCH_WORDS, "")
      .replace(DINNER_WORDS, "")
      .replace(/\s+/g, " ")
      .trim();
    if (stripped.length > 0) {
      queryBoost = queryBoost ? `${queryBoost} ${stripped}` : stripped;
    }
  }

  return {
    queryBoost: queryBoost.trim(),
    recipeType,
    maxReadyTime,
  };
}
