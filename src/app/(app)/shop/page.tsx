import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createEmptyShoppingList } from "@/app/actions";

export default async function ShopPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lists = await prisma.shoppingList.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shopping</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Open a list to copy, share, or download a PDF — grouped by aisle
          category when you build from the planner.
        </p>
      </div>
      <form
        action={async (fd) => {
          "use server";
          const title = String(fd.get("title") ?? "Groceries").trim() || "Groceries";
          const id = await createEmptyShoppingList(title);
          redirect(`/shop/${id}`);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          name="title"
          placeholder="List name"
          className="min-h-11 flex-1 rounded-lg border border-zinc-300 px-3 dark:border-zinc-600 dark:bg-zinc-950"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white"
        >
          New list
        </button>
      </form>
      <ul className="space-y-2">
        {lists.map((l) => (
          <li key={l.id}>
            <Link
              href={`/shop/${l.id}`}
              className="flex min-h-14 items-center rounded-xl border border-zinc-200 px-4 dark:border-zinc-800"
            >
              {l.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
