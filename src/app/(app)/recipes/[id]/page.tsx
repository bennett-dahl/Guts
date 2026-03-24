import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseStringArray } from "@/lib/json";
import { FavoriteButton } from "@/components/favorite-button";
import { RecipeIngredientTools } from "@/components/recipe-ingredient-tools";
import { LogCookedButton } from "@/components/log-cooked-button";
import { deleteRecipe } from "@/app/actions";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const recipe = await prisma.recipe.findFirst({
    where: { id, userId: session.user.id },
    include: {
      ingredients: { orderBy: { sortOrder: "asc" } },
      favorites: { where: { userId: session.user.id }, take: 1 },
    },
  });
  if (!recipe) notFound();

  const tags = parseStringArray(recipe.tags);
  const plants = parseStringArray(recipe.plantsUsed);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/recipes"
          className="text-sm text-emerald-700 dark:text-emerald-400"
        >
          ← Recipes
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{recipe.title}</h1>
          <FavoriteButton
            recipeId={recipe.id}
            favorited={recipe.favorites.length > 0}
          />
        </div>
        {recipe.description ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {recipe.description}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
          <span>Serves {recipe.servings}</span>
          <span>Difficulty {recipe.difficulty}/3</span>
          {recipe.activeTimeMin != null ? (
            <span>{recipe.activeTimeMin} min active</span>
          ) : null}
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <section>
        <h2 className="font-semibold">Ingredients</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {recipe.ingredients.map((ing) => (
            <li key={ing.id}>
              {ing.name}
              {ing.quantity != null
                ? ` — ${ing.quantity}${ing.unit ? ` ${ing.unit}` : ""}`
                : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold">Steps</h2>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-zinc-700 dark:text-zinc-300">
          {recipe.instructions}
        </pre>
      </section>

      {plants.length > 0 ? (
        <p className="text-xs text-zinc-500">
          Plants for diversity tracking: {plants.join(", ")}
        </p>
      ) : null}

      {recipe.sourceUrl ? (
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-emerald-700 underline dark:text-emerald-400"
        >
          View original source
        </a>
      ) : null}

      <RecipeIngredientTools
        recipeTitle={recipe.title}
        ingredients={recipe.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
        }))}
      />

      <LogCookedButton recipeId={recipe.id} />

      <form action={deleteRecipe.bind(null, recipe.id)}>
        <button
          type="submit"
          className="text-sm text-red-600 underline dark:text-red-400"
        >
          Delete recipe
        </button>
      </form>
    </div>
  );
}
