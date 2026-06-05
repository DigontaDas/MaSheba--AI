import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { ConsoleControls } from "@/components/ConsoleControls";
import { SidebarNav } from "@/components/SidebarNav";
import { getTranslation } from "@/utils/translations";
import { getServerLanguage } from "@/utils/translations-server";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const lang = await getServerLanguage();
  const t = getTranslation(lang);

  const navItems = [
    { href: "/dashboard", label: t.overview, icon: "map" },
    { href: "/dashboard/chws", label: lang === "bn" ? "স্বাস্থ্যকর্মী (CHWs)" : "CHW Registry", icon: "assignment_turned_in" },
    { href: "/dashboard/patients", label: lang === "bn" ? "নিবন্ধিত মা (Mothers)" : "Tracked Mothers", icon: "group" },
    { href: "/dashboard/qa", label: lang === "bn" ? "অফলাইন প্রশ্নোত্তর" : "Offline Q&A", icon: "menu_book" },
    { href: "/dashboard/telemetry", label: lang === "bn" ? "টেলিমেট্রি" : "Telemetry Logs", icon: "analytics" },
    { href: "/dashboard/audit", label: lang === "bn" ? "অডিট লগ" : "Audit Ledger", icon: "history" },
    { href: "/dashboard/exports", label: lang === "bn" ? "তথ্য রপ্তানি" : "Reports & Exports", icon: "description" },
    { href: "/dashboard/map", label: lang === "bn" ? "ঝুঁকি মানচিত্র" : "Risk Map", icon: "location_on" },
    { href: "/dashboard/settings", label: lang === "bn" ? "সিস্টেম সেটিংস" : "System Settings", icon: "settings" },
  ];

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md flex overflow-hidden">
      {/* SideNavBar (Desktop Only) */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant py-6 z-20">
        {/* Brand Header */}
        <div className="px-6 mb-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px] text-on-primary">
                child_care
              </span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-primary">
                MaaSheba AI
              </h1>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Admin Console
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4">
          <SidebarNav items={navItems} />
        </div>

        {/* Footer info */}
        <div className="px-6 mt-auto pt-6 border-t border-outline-variant/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
              AD
            </div>
            <div>
              <p className="font-label-lg text-label-lg text-on-surface">Administrator</p>
              <p className="text-xs text-on-surface-variant">Ops Center</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-64 h-screen overflow-hidden">
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-6 h-16 bg-surface border-b border-outline-variant sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {t.operations_workspace}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  {t.offline}
                </span>
              </div>
              <span className="hidden sm:inline text-xs text-on-surface-variant">
                {t.ops_subtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ConsoleControls />

            <form action={logoutAction} className="flex items-center">
              <button
                className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors cursor-pointer border border-outline-variant/50"
                type="submit"
                title={t.logout}
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </form>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
