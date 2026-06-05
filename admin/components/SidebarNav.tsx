"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5 w-full" aria-label="Admin sections">
      {items.map((item) => {
        // Active state checking: exact match for home dashboard, startsWith for others
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname?.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-surface-container text-primary border-r-4 border-primary font-bold opacity-100"
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              data-weight={isActive ? "fill" : "normal"}
            >
              {item.icon}
            </span>
            <span className="font-label-lg text-label-lg">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
