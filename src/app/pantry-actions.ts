"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { CookMealFocus } from "@/lib/cook-intent";
import { resolveCookIntent } from "@/lib/cook-intent";
import {
  planPantryDeductions,
  scoreRecipeAgainstPantry,
  type PantryRow,
} from "@/lib/pantry-match";
import { prisma } from "@/lib/prisma";
import {
  spoonacularFindByIngredients,
  spoonacularSearch,
  type SpoonacularByIngredientResult,
  type SpoonacularSearchResult,
} from "@/lib/spoonacular";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

const LOCATIONS = ["pantry", "fridge", "freezer"] as const;

function validLocation(s: string): s is (typeof LOCATIONS)[number] {
  return (LOCATIONS as readonly string[]).includes(s);
}

export async function applyPantryDeductionForRecipe(
  userId: string,
  recipeId: string,
) {
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, userId },
    include: { ingredients: true },
  });
  if (!recipe) return;

  const pantryDb = await prisma.pantryItem.findMany({ where: { userId } });
  const rows: PantryRow[] = pantryDb.map((p) => ({
    id: p.id,
    name: p.name,
    quantity: p.quantity,
    unit: p.unit,
    location: p.location,
  }));

  const updates = planPantryDeductions(
    recipe.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
    })),
    rows,
    recipe.servings,
    recipe.servings,
  );

  for (const u of updates) {
    if (u.newQuantity <= 0.0001) {
      await prisma.pantryItem.delete({ where: { id: u.id } });
    } else {
      await prisma.pantryItem.update({
        where: { id: u.id },
        data: { quantity: u.newQuantity },
      });
    }
  }
  if (updates.length > 0) {
    revalidatePath("/pantry");
    revalidatePath("/cook");
    revalidatePath("/today");
  }
}

export async function addPantryItem(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const quantity = Math.max(0, parseFloat(String(formData.get("quantity") ?? "1")) || 1);
  const unit = String(formData.get("unit") ?? "").trim() || null;
  const loc = String(formData.get("location") ?? "pantry");
  const location = validLocation(loc) ? loc : "pantry";
  const lowRaw = String(formData.get("lowThreshold") ?? "").trim();
  const lowThreshold =
    lowRaw === "" ? null : Math.max(0, parseFloat(lowRaw) || 0);

  const maxSort = await prisma.pantryItem.aggregate({
    where: { userId, location },
    _max: { sortOrder: true },
  });
  await prisma.pantryItem.create({
    data: {
      userId,
      name,
      quantity,
      unit,
      location,
      lowThreshold,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/pantry");
  revalidatePath("/today");
  revalidatePath("/cook");
}

export async function updatePantryItem(itemId: string, formData: FormData) {
  const userId = await requireUserId();
  const row = await prisma.pantryItem.findFirst({
    where: { id: itemId, userId },
  });
  if (!row) return;
  const name = String(formData.get("name") ?? "").trim() || row.name;
  const quantity = Math.max(0, parseFloat(String(formData.get("quantity") ?? String(row.quantity))) || 0);
  const unit = String(formData.get("unit") ?? "").trim() || null;
  const loc = String(formData.get("location") ?? row.location);
  const location = validLocation(loc) ? loc : row.location;
  const lowRaw = String(formData.get("lowThreshold") ?? "").trim();
  const lowThreshold =
    lowRaw === "" ? null : Math.max(0, parseFloat(lowRaw) || 0);
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  let expiresAt: Date | null = null;
  if (expiresRaw) {
    const d = new Date(expiresRaw);
    if (!Number.isNaN(d.getTime())) expiresAt = d;
  }

  await prisma.pantryItem.update({
    where: { id: itemId },
    data: { name, quantity, unit, location, lowThreshold, expiresAt },
  });
  revalidatePath("/pantry");
  revalidatePath("/today");
  revalidatePath("/cook");
}

export async function deletePantryItem(itemId: string) {
  const userId = await requireUserId();
  await prisma.pantryItem.deleteMany({
    where: { id: itemId, userId },
  });
  revalidatePath("/pantry");
  revalidatePath("/today");
  revalidatePath("/cook");
}

/** Quick “ate some” — subtract amount (min 0). */
export async function consumePantryAmount(itemId: string, formData: FormData) {
  const userId = await requireUserId();
  const row = await prisma.pantryItem.findFirst({
    where: { id: itemId, userId },
  });
  if (!row) return;
  const amt = Math.max(0, parseFloat(String(formData.get("amount") ?? "1")) || 0);
  const next = Math.max(0, row.quantity - amt);
  if (next <= 0.0001) {
    await prisma.pantryItem.delete({ where: { id: itemId } });
  } else {
    await prisma.pantryItem.update({
      where: { id: itemId },
      data: { quantity: next },
    });
  }
  revalidatePath("/pantry");
  revalidatePath("/today");
  revalidatePath("/cook");
}

export async function stockPantryFromShoppingList(formData: FormData) {
  const userId = await requireUserId();
  const listId = String(formData.get("listId") ?? "");
  if (!listId) return;
  const mode = String(formData.get("mode") ?? "checked");
  const loc = String(formData.get("location") ?? "pantry");
  const location = validLocation(loc) ? loc : "pantry";

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, userId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!list) return;

  const lines =
    mode === "all"
      ? list.items
      : list.items.filter((i) => i.checked);
  if (lines.length === 0) return;

  for (const line of lines) {
    const addQty = Math.max(0, line.quantity ?? 1);
    const existing = await prisma.pantryItem.findFirst({
      where: {
        userId,
        location,
        name: { equals: line.name, mode: "insensitive" },
      },
    });
    if (existing) {
      await prisma.pantryItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + addQty,
          unit: existing.unit ?? line.unit,
        },
      });
    } else {
      const maxSort = await prisma.pantryItem.aggregate({
        where: { userId, location },
        _max: { sortOrder: true },
      });
      await prisma.pantryItem.create({
        data: {
          userId,
          name: line.name,
          quantity: addQty,
          unit: line.unit,
          location,
          sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
        },
      });
    }
  }

  revalidatePath("/pantry");
  revalidatePath("/shop");
  revalidatePath(`/shop/${listId}`);
  revalidatePath("/today");
  revalidatePath("/cook");
}

export type SuggestFromPantryResult = {
  local: { id: string; title: string; score: number }[];
  byIngredients: SpoonacularByIngredientResult[];
  search: SpoonacularSearchResult[];
  spoonacularError: string | null;
  pantryItemCount: number;
  lowStock: { id: string; name: string; quantity: number; location: string }[];
};

export async function suggestFromPantry(
  hint: string,
  mealFocus: CookMealFocus,
): Promise<SuggestFromPantryResult> {
  const userId = await requireUserId();
  const intent = resolveCookIntent(hint, mealFocus);

  const pantry = await prisma.pantryItem.findMany({
    where: { userId, quantity: { gt: 0 } },
    orderBy: [{ quantity: "desc" }, { name: "asc" }],
  });
  const names = pantry.map((p) => p.name);

  const lowStock = pantry
    .filter(
      (p) =>
        p.lowThreshold != null &&
        p.quantity > 0 &&
        p.quantity <= p.lowThreshold,
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      location: p.location,
    }));

  const localRecipes = await prisma.recipe.findMany({
    where: { userId },
    include: { ingredients: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const pantryLines = pantry.map((p) => ({
    name: p.name,
    quantity: p.quantity,
  }));

  const local = localRecipes
    .map((r) => ({
      id: r.id,
      title: r.title,
      score: scoreRecipeAgainstPantry(
        r.ingredients.map((i) => i.name),
        pantryLines,
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  let byIngredients: SpoonacularByIngredientResult[] = [];
  let search: SpoonacularSearchResult[] = [];
  let spoonacularError: string | null = null;

  try {
    if (names.length > 0) {
      byIngredients = await spoonacularFindByIngredients(
        names.slice(0, 10),
        { number: 10, ranking: 2 },
      );
    }

    const qParts = [intent.queryBoost];
    if (!intent.queryBoost) {
      qParts.push("easy homemade");
    }
    const query = qParts.filter(Boolean).join(" ").trim();

    search = (
      await spoonacularSearch({
        query,
        type: intent.recipeType,
        maxReadyTime: intent.maxReadyTime,
        number: 12,
        includeIngredients: names.slice(0, 6),
      })
    ).results;

    const seen = new Set(byIngredients.map((r) => r.id));
    search = search.filter((r) => !seen.has(r.id));
  } catch (e) {
    spoonacularError =
      e instanceof Error ? e.message : "Spoonacular unavailable";
  }

  return {
    local,
    byIngredients,
    search,
    spoonacularError,
    pantryItemCount: pantry.length,
    lowStock,
  };
}
