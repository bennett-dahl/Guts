"use client";

import { jsPDF } from "jspdf";
import { formatLinesPlain } from "@/lib/format-shopping-text";

type IngredientLine = { name: string; quantity: number | null; unit: string | null };

export function RecipeIngredientTools({
  recipeTitle,
  ingredients,
}: {
  recipeTitle: string;
  ingredients: IngredientLine[];
}) {
  const lines = ingredients.map((ing) => {
    const q =
      ing.quantity != null
        ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ""}`.trim()
        : "";
    return q ? `${ing.name} — ${q}` : ing.name;
  });
  const body = formatLinesPlain(lines);
  const fullText = `${recipeTitle} — ingredients\n\n${body}`;

  const writePdf = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(recipeTitle, 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text("Ingredients", 14, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lineH = 5;
    for (const line of lines) {
      const wrapped = doc.splitTextToSize(`• ${line}`, 180);
      if (y + wrapped.length * lineH > 285) {
        doc.addPage();
        y = 20;
      }
      doc.text(wrapped, 14, y);
      y += wrapped.length * lineH + 1;
    }
    doc.save(`${recipeTitle.replace(/\s+/g, "-")}-ingredients.pdf`);
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
        await navigator.share({
          title: `${recipeTitle} (ingredients)`,
          text: fullText,
        });
        return;
      }
      await copy();
      alert("Shared via clipboard — paste into Messages, Notes, or email.");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      await copy();
      alert("Could not use Share — ingredients copied to clipboard instead.");
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Shop this recipe
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Copy or share the ingredient list into your notes app or grocery order
        flow.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          onClick={() => void copy()}
        >
          Copy ingredients
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
          Ingredients PDF
        </button>
      </div>
    </div>
  );
}
