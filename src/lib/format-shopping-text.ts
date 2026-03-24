export type ShoppingLine = {
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
};

function lineText(i: ShoppingLine): string {
  const q =
    i.quantity != null
      ? `${i.quantity}${i.unit ? ` ${i.unit}` : ""}`.trim()
      : "";
  return q ? `${i.name} — ${q}` : i.name;
}

/** Plain text with category sections (store-aisle friendly). */
export function formatShoppingListGrouped(items: ShoppingLine[]): string {
  const grouped = new Map<string, ShoppingLine[]>();
  for (const item of items) {
    const cat = item.category || "Other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }
  const blocks: string[] = [];
  for (const [category, group] of [...grouped.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    blocks.push(
      [category, ...group.map(lineText), ""].join("\n"),
    );
  }
  return blocks.join("\n").trim();
}

/** Single block, no categories (e.g. recipe ingredients). */
export function formatLinesPlain(lines: string[]): string {
  return lines.join("\n").trim();
}
