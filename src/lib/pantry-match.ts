import { normalizePantryName, significantTokens } from "@/lib/pantry-normalize";

export type PantryRow = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  location: string;
};

function scoreMatch(pantryName: string, ingredientName: string): number {
  const p = normalizePantryName(pantryName);
  const i = normalizePantryName(ingredientName);
  if (!p || !i) return 0;
  if (i === p) return 1;
  if (i.includes(p) || p.includes(i)) return 0.9;
  const tp = significantTokens(pantryName);
  const ti = significantTokens(ingredientName);
  if (tp.length === 0 || ti.length === 0) return 0;
  let hit = 0;
  for (const t of tp) {
    if (ti.some((x) => x === t || x.includes(t) || t.includes(x))) hit++;
  }
  return hit / Math.max(tp.length, 1) > 0.5 ? 0.7 : 0;
}

export function findBestPantryMatch(
  ingredientLine: string,
  pantry: PantryRow[],
): PantryRow | null {
  let best: PantryRow | null = null;
  let bestScore = 0;
  for (const row of pantry) {
    if (row.quantity <= 0) continue;
    const sc = scoreMatch(row.name, ingredientLine);
    if (sc > bestScore) {
      bestScore = sc;
      best = row;
    }
  }
  return bestScore >= 0.65 ? best : null;
}

/**
 * Subtract recipe ingredients from pantry (best-effort; units treated loosely).
 * Mutates working copy of quantities; returns list of { id, newQty } to persist.
 */
export function planPantryDeductions(
  ingredients: { name: string; quantity: number | null; unit: string | null }[],
  pantry: PantryRow[],
  servingsInRecipe: number,
  servingsPrepared: number,
): { id: string; newQuantity: number }[] {
  const scale =
    servingsPrepared / Math.max(1, Math.min(servingsInRecipe, 999) || 1);
  const state = new Map(
    pantry.map((p) => [p.id, { ...p, quantity: p.quantity }]),
  );

  for (const ing of ingredients) {
    const rows = [...state.values()].filter((r) => r.quantity > 0);
    const match = findBestPantryMatch(ing.name, rows);
    if (!match) continue;
    const cur = state.get(match.id);
    if (!cur || cur.quantity <= 0) continue;
    const need = Math.max(0, (ing.quantity ?? 1) * scale);
    const deduct = Math.min(need, cur.quantity);
    cur.quantity -= deduct;
  }

  const updates: { id: string; newQuantity: number }[] = [];
  for (const p of pantry) {
    const n = state.get(p.id);
    if (n && n.quantity !== p.quantity) {
      updates.push({ id: p.id, newQuantity: Math.max(0, n.quantity) });
    }
  }
  return updates;
}

export function scoreRecipeAgainstPantry(
  ingredientNames: string[],
  pantryLines: { name: string; quantity: number }[],
): number {
  if (ingredientNames.length === 0) return 0;
  const pantryRows: PantryRow[] = pantryLines
    .filter((p) => p.quantity > 0)
    .map((p, i) => ({
      id: `p${i}`,
      name: p.name,
      quantity: p.quantity,
      unit: null,
      location: "pantry",
    }));
  let hits = 0;
  for (const ing of ingredientNames) {
    if (findBestPantryMatch(ing, pantryRows)) hits++;
  }
  return hits / ingredientNames.length;
}
