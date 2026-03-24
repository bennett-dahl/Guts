"use client";

import { jsPDF } from "jspdf";
import {
  formatShoppingListGrouped,
  type ShoppingLine,
} from "@/lib/format-shopping-text";

export function ShoppingListTools({
  title,
  items,
}: {
  title: string;
  items: ShoppingLine[];
}) {
  const groupedBody = formatShoppingListGrouped(items);
  const fullText = `${title}\n\n${groupedBody}`;

  const writePdf = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(14);
    doc.text(title, 14, y);
    y += 10;
    doc.setFontSize(10);

    const grouped = new Map<string, ShoppingLine[]>();
    for (const item of items) {
      const cat = item.category || "Other";
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(item);
    }

    for (const [category, group] of [...grouped.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      const head = doc.splitTextToSize(category, 180);
      doc.text(head, 14, y);
      y += head.length * 5 + 2;
      doc.setFont("helvetica", "normal");
      for (const i of group) {
        const q =
          i.quantity != null
            ? `${i.quantity}${i.unit ? ` ${i.unit}` : ""}`.trim()
            : "";
        const line = q ? `${i.name} — ${q}` : i.name;
        const wrapped = doc.splitTextToSize(`• ${line}`, 176);
        if (y + wrapped.length * 5 > 285) {
          doc.addPage();
          y = 20;
        }
        doc.text(wrapped, 18, y);
        y += wrapped.length * 5 + 1;
      }
      y += 4;
    }

    doc.save(`${title.replace(/\s+/g, "-")}.pdf`);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
    } catch {
      alert("Could not copy to clipboard.");
    }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: fullText });
        return;
      }
      await copy();
      alert("Shared via clipboard — paste into Messages, Notes, or email.");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      await copy();
      alert("Could not use Share — list copied to clipboard instead.");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Copy, share, or save a PDF — use your usual grocery app or store site
        from there.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          onClick={() => void copy()}
        >
          Copy list
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
          onClick={() => void share()}
        >
          Share
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
          onClick={writePdf}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
