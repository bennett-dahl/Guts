import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InstacartListButton } from "@/components/instacart-button";
import { ListCheck } from "@/components/list-check";
import { ShoppingListTools } from "@/components/shopping-list-tools";

export default async function ShopListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const list = await prisma.shoppingList.findFirst({
    where: { id, userId: session.user.id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!list) notFound();

  const grouped = new Map<string, typeof list.items>();
  for (const item of list.items) {
    const cat = item.category || "Other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/shop"
          className="text-sm text-emerald-700 dark:text-emerald-400"
        >
          ← Lists
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{list.title}</h1>
      </div>

      <ShoppingListTools
        title={list.title}
        items={list.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          category: i.category,
        }))}
      />

      <InstacartListButton listId={list.id} />

      <div className="space-y-6">
        {[...grouped.entries()].map(([category, items]) => (
          <section key={category}>
            <h2 className="text-sm font-semibold text-zinc-500">{category}</h2>
            <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 py-2 first:pt-0"
                >
                  <ListCheck itemId={item.id} checked={item.checked} />
                  <span
                    className={
                      item.checked ? "text-zinc-400 line-through" : undefined
                    }
                  >
                    {item.name}
                    {item.quantity != null
                      ? ` — ${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        <strong>Non-Instacart:</strong> use Copy list or PDF. Kroger, Target,
        and DoorDash do not offer the same personal cart APIs; Instacart
        Developer Platform is the supported handoff here.
      </p>
    </div>
  );
}
