"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export function MobileNav({ items }: { items: NavItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden flex items-center">
      {/* Hamburger Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors cursor-pointer border border-outline-variant/50"
        aria-label="Open navigation menu"
        type="button"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Backdrop and Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-out Menu Panel */}
          <div className="relative flex flex-col w-72 max-w-xs bg-surface border-r border-outline-variant h-full p-6 shadow-2xl z-10 animate-fade-in">
            {/* Header / Logo */}
            <div className="flex items-center justify-between mb-8">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-on-primary">child_care</span>
                </div>
                <div>
                  <h1 className="font-headline-md text-base font-bold text-primary">MaaSheba AI</h1>
                  <p className="font-label-sm text-[10px] text-on-surface-variant">Admin Console</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface-variant"
                aria-label="Close navigation menu"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto flex flex-col gap-1" aria-label="Mobile admin sections">
              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-surface-container text-primary border-r-4 border-primary font-bold"
                        : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      data-weight={isActive ? "fill" : "normal"}
                    >
                      {item.icon}
                    </span>
                    <span className="font-label-lg text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer context */}
            <div className="mt-auto pt-4 border-t border-outline-variant/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
                AD
              </div>
              <div>
                <p className="font-label-lg text-xs font-bold text-on-surface">Administrator</p>
                <p className="text-[10px] text-on-surface-variant">Ops Center</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
