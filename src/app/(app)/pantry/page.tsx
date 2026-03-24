import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  addPantryItem,
  consumePantryAmount,
  deletePantryItem,
  updatePantryItem,
} from "@/app/pantry-actions";

const LOCATIONS = [
  { id: "pantry", label: "Pantry" },
  { id: "fridge", label: "Fridge" },
  { id: "freezer", label: "Freezer" },
] as const;

export default async function PantryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const items = await prisma.pantryItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ location: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const byLoc = new Map<string, typeof items>();
  for (const loc of LOCATIONS) byLoc.set(loc.id, []);
  for (const row of items) {
    const bucket = byLoc.get(row.location) ?? byLoc.get("pantry")!;
    bucket.push(row);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Pantry & fridge</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Track what you have at home. After shopping, add items from a list.
          Logging a cooked recipe subtracts matched ingredients.{" "}
          <Link
            href="/cook"
            className="font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            Cook from what you have
          </Link>
          .
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Add item</h2>
        <form action={addPantryItem} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-zinc-500 sm:col-span-2">
            Name
            <input
              name="name"
              required
              placeholder="e.g. Greek yogurt"
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Quantity
            <input
              name="quantity"
              type="number"
              step="any"
              min={0}
              defaultValue={1}
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Unit (optional)
            <input
              name="unit"
              placeholder="cup, lb, each…"
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Location
            <select
              name="location"
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            >
              {LOCATIONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-zinc-500">
            Low-stock alert at (optional)
            <input
              name="lowThreshold"
              type="number"
              step="any"
              min={0}
              placeholder="e.g. 1"
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              className="min-h-11 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800 sm:w-auto sm:px-8"
            >
              Add to stock
            </button>
          </div>
        </form>
      </section>

      {LOCATIONS.map((loc) => {
        const rows = byLoc.get(loc.id) ?? [];
        if (rows.length === 0) return null;
        return (
          <section key={loc.id} className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-500">{loc.label}</h2>
            <ul className="space-y-4">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <form
                    action={updatePantryItem.bind(null, row.id)}
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    <label className="block text-xs text-zinc-500 sm:col-span-2 lg:col-span-1">
                      Name
                      <input
                        name="name"
                        defaultValue={row.name}
                        className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                      />
                    </label>
                    <label className="block text-xs text-zinc-500">
                      Qty
                      <input
                        name="quantity"
                        type="number"
                        step="any"
                        min={0}
                        defaultValue={row.quantity}
                        className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                      />
                    </label>
                    <label className="block text-xs text-zinc-500">
                      Unit
                      <input
                        name="unit"
                        defaultValue={row.unit ?? ""}
                        className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                      />
                    </label>
                    <label className="block text-xs text-zinc-500">
                      Location
                      <select
                        name="location"
                        defaultValue={row.location}
                        className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                      >
                        {LOCATIONS.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs text-zinc-500">
                      Low at
                      <input
                        name="lowThreshold"
                        type="number"
                        step="any"
                        min={0}
                        defaultValue={row.lowThreshold ?? ""}
                        placeholder="—"
                        className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                      />
                    </label>
                    <label className="block text-xs text-zinc-500">
                      Expires
                      <input
                        name="expiresAt"
                        type="date"
                        defaultValue={
                          row.expiresAt
                            ? row.expiresAt.toISOString().slice(0, 10)
                            : ""
                        }
                        className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                      <button
                        type="submit"
                        className="min-h-11 rounded-xl border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-600"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <form
                      action={consumePantryAmount.bind(null, row.id)}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <label className="text-xs text-zinc-500">
                        Ate / used
                        <input
                          name="amount"
                          type="number"
                          step="any"
                          min={0}
                          defaultValue={1}
                          className="mt-1 min-h-11 w-24 rounded-xl border border-zinc-300 px-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                        />
                      </label>
                      <button
                        type="submit"
                        className="min-h-11 rounded-xl bg-zinc-100 px-3 text-sm font-medium dark:bg-zinc-800"
                      >
                        Subtract
                      </button>
                    </form>
                    <form action={deletePantryItem.bind(null, row.id)}>
                      <button
                        type="submit"
                        className="min-h-11 text-sm text-red-600 underline dark:text-red-400"
                      >
                        Remove / spoiled
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nothing on the shelves yet. Add items above, or stock from a shopping
          list after a trip.
        </p>
      ) : null}
    </div>
  );
}
