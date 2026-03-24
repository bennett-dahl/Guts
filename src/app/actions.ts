"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { defaultDietSettingsJson } from "@/lib/default-diet";
import { isValidDiscoverDiet } from "@/lib/spoonacular-filters";
import { parseStringArray, stringifyStringArray } from "@/lib/json";
import { guessCategory } from "@/lib/shop-category";
import { plantsFromIngredientNames } from "@/lib/plants";
import type { ParsedRecipe } from "@/lib/recipe-import";
import { importRecipeFromUrl } from "@/lib/recipe-import";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function ensureProfile() {
  const userId = await requireUserId();
  const existing = await prisma.idealDietProfile.findUnique({
    where: { userId },
  });
  if (!existing) {
    await prisma.idealDietProfile.create({
      data: { userId, settings: defaultDietSettingsJson() },
    });
  }
}

export async function completeOnboarding() {
  const userId = await requireUserId();
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingDone: true },
  });
  revalidatePath("/", "layout");
  redirect("/today");
}

export async function updateDiscoverSearchDefaults(formData: FormData) {
  const userId = await requireUserId();
  const diet = String(formData.get("discoverDefaultDiet") ?? "");
  const queryRaw = String(formData.get("discoverDefaultQuery") ?? "");
  if (!isValidDiscoverDiet(diet)) {
    throw new Error("Invalid diet filter");
  }
  const query = queryRaw.slice(0, 120).trim();

  await ensureProfile();
  const profile = await prisma.idealDietProfile.findUnique({
    where: { userId },
  });
  if (!profile) return;

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(profile.settings) as Record<string, unknown>;
  } catch {
    obj = JSON.parse(defaultDietSettingsJson()) as Record<string, unknown>;
  }
  obj.discoverDefaultDiet = diet;
  obj.discoverDefaultQuery = query;

  await prisma.idealDietProfile.update({
    where: { userId },
    data: { settings: JSON.stringify(obj) },
  });
  revalidatePath("/discover");
  revalidatePath("/more");
}

export async function importRecipeFromUrlAction(url: string) {
  const parsed = await importRecipeFromUrl(url);
  const id = await createRecipeFromParsed(parsed);
  redirect(`/recipes/${id}`);
}

export async function createRecipeFromParsed(data: ParsedRecipe & {
  difficulty?: number;
  activeTimeMin?: number;
  tags?: string[];
}) {
  const userId = await requireUserId();
  const ingNames = data.ingredients.map((i) => i.name);
  const plants = plantsFromIngredientNames(ingNames);
  const tags = data.tags?.length ? data.tags : ["imported"];

  const recipe = await prisma.recipe.create({
    data: {
      userId,
      title: data.title,
      description: data.description ?? null,
      sourceUrl: data.sourceUrl,
      imageUrl: data.imageUrl ?? null,
      servings: data.servings,
      difficulty: data.difficulty ?? 2,
      activeTimeMin: data.activeTimeMin ?? null,
      tags: stringifyStringArray(tags),
      instructions: data.instructions,
      plantsUsed: stringifyStringArray(plants),
      ingredients: {
        create: data.ingredients.map((ing, i) => ({
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          sortOrder: i,
        })),
      },
    },
  });
  revalidatePath("/recipes");
  return recipe.id;
}

export async function createRecipeManual(formData: FormData) {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const servings = Math.max(1, parseInt(String(formData.get("servings")), 10) || 4);
  const difficulty = Math.min(3, Math.max(1, parseInt(String(formData.get("difficulty")), 10) || 2));
  const activeRaw = formData.get("activeTimeMin");
  const activeTimeMin =
    activeRaw != null && String(activeRaw).trim() !== ""
      ? parseInt(String(activeRaw), 10)
      : undefined;
  const instructions = String(formData.get("instructions") ?? "").trim();
  const tags = String(formData.get("tags") ?? "");
  const ingredientsText = String(formData.get("ingredientsText") ?? "");

  const lines = ingredientsText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const ingredients = lines.map((name, i) => ({
    name,
    quantity: null as number | null,
    unit: null as string | null,
    sortOrder: i,
  }));
  const plants = plantsFromIngredientNames(lines);
  const tagList = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const recipe = await prisma.recipe.create({
    data: {
      userId,
      title,
      description: description || null,
      servings,
      difficulty,
      activeTimeMin:
        activeTimeMin != null && Number.isFinite(activeTimeMin)
          ? activeTimeMin
          : null,
      instructions,
      tags: stringifyStringArray(tagList.length ? tagList : ["manual"]),
      plantsUsed: stringifyStringArray(plants),
      ingredients: { create: ingredients },
    },
  });
  revalidatePath("/recipes");
  redirect(`/recipes/${recipe.id}`);
}

export async function deleteRecipe(id: string) {
  const userId = await requireUserId();
  await prisma.recipe.deleteMany({ where: { id, userId } });
  revalidatePath("/recipes");
}

export async function toggleFavorite(recipeId: string) {
  const userId = await requireUserId();
  const existing = await prisma.favorite.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId, recipeId } });
  }
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
}

export async function getOrCreateWeekPlan(weekStartIso: string) {
  const userId = await requireUserId();
  const weekStart = new Date(weekStartIso);
  let plan = await prisma.mealPlan.findFirst({
    where: { userId, weekStart },
    include: { meals: { include: { recipe: true } } },
  });
  if (!plan) {
    plan = await prisma.mealPlan.create({
      data: { userId, weekStart },
      include: { meals: { include: { recipe: true } } },
    });
  }
  return plan;
}

export async function addPlannedMeal(input: {
  mealPlanId: string;
  dateIso: string;
  slot: string;
  recipeId: string;
}) {
  const userId = await requireUserId();
  const plan = await prisma.mealPlan.findFirst({
    where: { id: input.mealPlanId, userId },
  });
  if (!plan) throw new Error("Plan not found");
  await prisma.plannedMeal.create({
    data: {
      mealPlanId: input.mealPlanId,
      date: new Date(input.dateIso),
      slot: input.slot,
      recipeId: input.recipeId,
    },
  });
  revalidatePath("/planner");
}

export async function removePlannedMeal(mealId: string) {
  const userId = await requireUserId();
  const meal = await prisma.plannedMeal.findUnique({
    where: { id: mealId },
    include: { mealPlan: true },
  });
  if (!meal || meal.mealPlan.userId !== userId) return;
  await prisma.plannedMeal.delete({ where: { id: mealId } });
  revalidatePath("/planner");
}

export async function buildShoppingListFromPlan(mealPlanId: string) {
  const userId = await requireUserId();
  const plan = await prisma.mealPlan.findFirst({
    where: { id: mealPlanId, userId },
    include: {
      meals: {
        include: {
          recipe: { include: { ingredients: true } },
        },
      },
    },
  });
  if (!plan) throw new Error("Plan not found");

  type Agg = { name: string; quantity: number; unit: string | null; category: string };
  const map = new Map<string, Agg>();

  for (const m of plan.meals) {
    if (!m.recipe) continue;
    const scale = m.recipe.servings > 0 ? 1 : 1;
    for (const ing of m.recipe.ingredients) {
      const key = ing.name.toLowerCase().trim();
      const cat = guessCategory(ing.name);
      const q = (ing.quantity ?? 1) * scale;
      const existing = map.get(key);
      if (existing && existing.unit === (ing.unit ?? null)) {
        existing.quantity += q;
      } else if (!existing) {
        map.set(key, {
          name: ing.name,
          quantity: q,
          unit: ing.unit ?? null,
          category: cat,
        });
      }
    }
  }

  const list = await prisma.shoppingList.create({
    data: {
      userId,
      title: `Week of ${plan.weekStart.toLocaleDateString()}`,
      mealPlanId: plan.id,
      items: {
        create: [...map.values()].map((row, i) => ({
          name: row.name,
          quantity: row.quantity,
          unit: row.unit,
          category: row.category,
          sortOrder: i,
        })),
      },
    },
  });
  revalidatePath("/shop");
  return list.id;
}

export async function createEmptyShoppingList(title: string) {
  const userId = await requireUserId();
  const list = await prisma.shoppingList.create({
    data: { userId, title },
  });
  revalidatePath("/shop");
  return list.id;
}

export async function toggleListItem(itemId: string, checked: boolean) {
  const userId = await requireUserId();
  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId },
    include: { list: true },
  });
  if (!item || item.list.userId !== userId) return;
  await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { checked },
  });
  revalidatePath("/shop");
}

export async function logMealCooked(recipeId: string) {
  const userId = await requireUserId();
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, userId },
  });
  if (!recipe) return;
  const plants = parseStringArray(recipe.plantsUsed);
  await prisma.mealCompletionLog.create({
    data: {
      userId,
      recipeId,
      plants: stringifyStringArray(plants),
    },
  });
  const { applyPantryDeductionForRecipe } = await import("./pantry-actions");
  await applyPantryDeductionForRecipe(userId, recipeId);
  revalidatePath("/track");
  revalidatePath("/today");
}

export async function approveInboxItem(inboxId: string) {
  const userId = await requireUserId();
  const row = await prisma.recipeInbox.findFirst({
    where: { id: inboxId, userId, status: "pending" },
  });
  if (!row) return;
  const payload = JSON.parse(row.payload) as ParsedRecipe & {
    difficulty?: number;
    activeTimeMin?: number;
  };
  await createRecipeFromParsed(payload);
  await prisma.recipeInbox.update({
    where: { id: inboxId },
    data: { status: "approved" },
  });
  revalidatePath("/discover");
  revalidatePath("/recipes");
}

export async function rejectInboxItem(inboxId: string) {
  const userId = await requireUserId();
  await prisma.recipeInbox.updateMany({
    where: { id: inboxId, userId },
    data: { status: "rejected" },
  });
  revalidatePath("/discover");
}

export async function queueSpoonacularRecipe(spoonacularId: number) {
  const userId = await requireUserId();
  const { spoonacularRecipeInformation, toParsedRecipe } = await import(
    "@/lib/spoonacular"
  );
  const info = await spoonacularRecipeInformation(spoonacularId);
  const parsed = toParsedRecipe(info);
  await prisma.recipeInbox.create({
    data: {
      userId,
      source: `spoonacular:${spoonacularId}`,
      status: "pending",
      payload: JSON.stringify({
        ...parsed,
        difficulty: 2,
        activeTimeMin: info.readyInMinutes,
        tags: ["spoonacular", "discovered"],
      }),
    },
  });
  revalidatePath("/discover");
}
