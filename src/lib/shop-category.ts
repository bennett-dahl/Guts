const PRODUCE = /\b(onion|garlic|lettuce|spinach|kale|carrot|tomato|pepper|apple|banana|berry|berries|lemon|lime|orange|potato|sweet potato|broccoli|cauliflower|cucumber|zucchini|squash|mushroom|avocado|celery|ginger|herb|cilantro|parsley|basil|mint|fruit|vegetable|greens|salad|arugula|cabbage)\b/i;

const DAIRY = /\b(milk|cheese|yogurt|butter|cream|feta|parmesan|cheddar|mozzarella)\b/i;

const PANTRY = /\b(oil|vinegar|salt|pepper|spice|flour|sugar|rice|pasta|quinoa|oats|stock|broth|sauce|can |canned|beans|lentil|chickpea|tahini|nut butter|honey|maple)\b/i;

const FROZEN = /\b(frozen)\b/i;

export function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (FROZEN.test(n)) return "Frozen";
  if (PRODUCE.test(n)) return "Produce";
  if (DAIRY.test(n)) return "Dairy";
  if (PANTRY.test(n)) return "Pantry";
  return "Other";
}
