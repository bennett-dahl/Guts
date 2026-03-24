"use client";

import { jsPDF } from "jspdf";

type Item = { name: string; quantity: number | null; unit: string | null; category: string | null };

export function ShoppingListTools({
  title,
  items,
}: {
  title: string;
  items: Item[];
}) {
  const text = items
    .map((i) => {
      const q =
        i.quantity != null
          ? `${i.quantity}${i.unit ? ` ${i.unit}` : ""}`.trim()
          : "";
      return q ? `${i.name} — ${q}` : i.name;
    })
    .join("\n");

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="min-h-11 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`${title}\n\n${text}`);
          } catch {
            alert("Could not copy to clipboard.");
          }
        }}
      >
        Copy list
      </button>
      <button
        type="button"
        className="min-h-11 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
        onClick={() => {
          const doc = new jsPDF();
          doc.setFontSize(14);
          doc.text(title, 14, 20);
          doc.setFontSize(10);
          const lines = doc.splitTextToSize(text, 180);
          doc.text(lines, 14, 30);
          doc.save(`${title.replace(/\s+/g, "-")}.pdf`);
        }}
      >
        Download PDF
      </button>
    </div>
  );
}
