/** Values accepted by Spoonacular `complexSearch` (see food-api docs). */

/** Flat list for settings validation & More page select. */
export const DIET_OPTIONS = [
  { value: "", label: "Any diet (plants, fish, meat)" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescetarian", label: "Pescetarian" },
  { value: "gluten free", label: "Gluten free" },
  { value: "whole30", label: "Whole30" },
  { value: "paleo", label: "Paleo" },
  { value: "primal", label: "Primal" },
  { value: "ketogenic", label: "Ketogenic" },
] as const;

export type DiscoverDietValue = (typeof DIET_OPTIONS)[number]["value"];

const ALLOWED_DIETS = new Set<string>(
  DIET_OPTIONS.map((o) => o.value),
);

export function isValidDiscoverDiet(value: string): value is DiscoverDietValue {
  return ALLOWED_DIETS.has(value);
}

/** Grouped for Discover diet `<select>` (plants → fish → other). */
export const DIET_SELECT_GROUPS: {
  label: string;
  options: { value: string; label: string }[];
}[] = [
  {
    label: "Plant-forward",
    options: [
      { value: "vegetarian", label: "Vegetarian" },
      { value: "vegan", label: "Vegan" },
    ],
  },
  {
    label: "Fish",
    options: [{ value: "pescetarian", label: "Pescetarian" }],
  },
  {
    label: "Other filters",
    options: [
      { value: "gluten free", label: "Gluten free" },
      { value: "whole30", label: "Whole30" },
      { value: "paleo", label: "Paleo" },
      { value: "primal", label: "Primal" },
      { value: "ketogenic", label: "Ketogenic" },
    ],
  },
];

export const MAX_TIME_OPTIONS = [
  { value: "", label: "Any cook time" },
  { value: "15", label: "≤ 15 min" },
  { value: "30", label: "≤ 30 min" },
  { value: "45", label: "≤ 45 min" },
  { value: "60", label: "≤ 60 min" },
] as const;

export const SORT_OPTIONS = [
  { value: "popularity", label: "Popularity" },
  { value: "time", label: "Fastest" },
  { value: "healthiness", label: "Healthiness" },
  { value: "random", label: "Random" },
] as const;

export const TYPE_OPTIONS = [
  { value: "", label: "Any course" },
  { value: "main course", label: "Main course" },
  { value: "side dish", label: "Side dish" },
  { value: "salad", label: "Salad" },
  { value: "breakfast", label: "Breakfast" },
  { value: "dessert", label: "Dessert" },
  { value: "soup", label: "Soup" },
  { value: "snack", label: "Snack" },
  { value: "appetizer", label: "Appetizer" },
] as const;

export const CUISINE_OPTIONS = [
  { value: "", label: "Any cuisine" },
  { value: "american", label: "American" },
  { value: "indian", label: "Indian" },
  { value: "italian", label: "Italian" },
  { value: "mexican", label: "Mexican" },
  { value: "thai", label: "Thai" },
  { value: "chinese", label: "Chinese" },
  { value: "japanese", label: "Japanese" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "middle eastern", label: "Middle Eastern" },
  { value: "french", label: "French" },
  { value: "greek", label: "Greek" },
  { value: "korean", label: "Korean" },
  { value: "vietnamese", label: "Vietnamese" },
] as const;

export const INTOLERANCE_OPTIONS = [
  { id: "dairy", label: "Dairy" },
  { id: "egg", label: "Egg" },
  { id: "gluten", label: "Gluten" },
  { id: "grain", label: "Grain" },
  { id: "peanut", label: "Peanut" },
  { id: "seafood", label: "Seafood" },
  { id: "sesame", label: "Sesame" },
  { id: "shellfish", label: "Shellfish" },
  { id: "soy", label: "Soy" },
  { id: "sulfite", label: "Sulfite" },
  { id: "tree nut", label: "Tree nut" },
  { id: "wheat", label: "Wheat" },
] as const;

export type IntoleranceId = (typeof INTOLERANCE_OPTIONS)[number]["id"];
