"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/today", label: "Today", icon: "◎" },
  { href: "/recipes", label: "Recipes", icon: "☰" },
  { href: "/planner", label: "Plan", icon: "▦" },
  { href: "/shop", label: "Shop", icon: "◫" },
  { href: "/more", label: "More", icon: "⋯" },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-[var(--background)] pb-[max(0.5rem,env(safe-area-inset-bottom))] dark:border-zinc-800 md:hidden"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg justify-between px-1 pt-1">
        {tabs.map(({ href, label, icon }) => {
          const active =
            href === "/today"
              ? pathname === "/today"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {icon}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TabletSideNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-52 shrink-0 border-r border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/80 md:block">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Guts
      </p>
      <ul className="space-y-1">
        {tabs.map(({ href, label }) => {
          const active =
            href === "/today"
              ? pathname === "/today"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`block min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  active
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
