"use client";

import { useTransition } from "react";
import { toggleListItem } from "@/app/actions";

export function ListCheck({
  itemId,
  checked,
}: {
  itemId: string;
  checked: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 py-1">
      <input
        type="checkbox"
        className="size-5 shrink-0 accent-emerald-600"
        checked={checked}
        disabled={pending}
        onChange={(e) => {
          start(() => toggleListItem(itemId, e.target.checked));
        }}
      />
    </label>
  );
}
