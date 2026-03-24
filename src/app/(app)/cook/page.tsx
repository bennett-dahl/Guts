import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CookFromHome } from "./cook-from-home";

export default async function CookPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const count = await prisma.pantryItem.count({
    where: { userId: session.user.id, quantity: { gt: 0 } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cook from home</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Suggestions use what you logged in{" "}
          <Link
            href="/pantry"
            className="font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            Pantry & fridge
          </Link>{" "}
          ({count} items in stock). Say what you are in the mood for — snack,
          breakfast, lunch, or dinner — and we will rank your recipes and query
          Spoonacular with your staples.
        </p>
      </div>
      <CookFromHome />
    </div>
  );
}
