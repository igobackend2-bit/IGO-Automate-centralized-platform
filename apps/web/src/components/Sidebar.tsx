"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/contacts", label: "Unified Contacts" },
  { href: "/campaigns", label: "Campaign Builder" },
  { href: "/onboarding", label: "New-Customer Onboarding" },
  { href: "/analytics", label: "Delivery & Reply Analytics" },
  { href: "/aria", label: "Aria Persona Console" },
  { href: "/templates", label: "Templates & Compliance" },
  { href: "/admin", label: "Admin & Access" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6 px-2">
        <p className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          IGO Automate
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">IGO Precision Farming</p>
      </div>
      <ul className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
