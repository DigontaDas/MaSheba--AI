"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  document.cookie = `maasheba_theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}

export function ConsoleControls() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(true);

  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("maasheba.admin.theme");
    const nextTheme = storedTheme === "light" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function updateTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    window.localStorage.setItem("maasheba.admin.theme", nextTheme);
    applyTheme(nextTheme);
  }

  function handleSync() {
    if (isSyncing) return;
    setIsSyncing(true);
    setUnreadNotifications(true);
    setTimeout(() => {
      setIsSyncing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }, 2000);
  }

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => updateTheme(theme === "dark" ? "light" : "dark")}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer border border-outline-variant/50"
        type="button"
      >
        <span className="material-symbols-outlined">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
      </button>

      <button
        onClick={handleSync}
        aria-label="Sync data"
        title="Sync data"
        disabled={isSyncing}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer ${
          isSyncing ? "text-primary opacity-60" : ""
        }`}
        type="button"
      >
        <span className={`material-symbols-outlined ${isSyncing ? "animate-spin" : ""}`}>sync</span>
      </button>

      <div className="relative" ref={notificationRef}>
        <button
          onClick={() => {
            setShowNotifications(!showNotifications);
            setUnreadNotifications(false);
          }}
          aria-label="Notifications"
          title="Notifications"
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors relative cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadNotifications ? (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error border-2 border-surface rounded-full" />
          ) : null}
        </button>

        {showNotifications ? (
          <div className="absolute right-0 mt-2 w-80 bg-surface border border-outline-variant rounded-xl shadow-lg z-30 py-2 text-sm font-body-md text-on-surface">
            <div className="px-4 py-2 border-b border-outline-variant/60 bg-surface-container-lowest font-bold text-xs uppercase tracking-wider text-on-surface-variant flex justify-between items-center">
              <span>System Alerts</span>
              <button onClick={() => setUnreadNotifications(false)} className="text-[10px] text-primary hover:underline cursor-pointer" type="button">
                Mark all read
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant/40">
              <NotificationItem icon="error" tone="text-error" title="SMS Send Failure" body="Critical warning alert message to CHW_B failed." time="12 mins ago" />
              <NotificationItem icon="check_circle" tone="text-primary" title="Supabase Sync Successful" body="Sync completed. Regional records were refreshed." time="Just now" />
              <NotificationItem icon="verified_user" tone="text-secondary" title="Admin Login Detected" body="New admin session established." time="2 hours ago" />
            </div>
          </div>
        ) : null}
      </div>

      <button
        onClick={() => setShowHelp(true)}
        aria-label="Help"
        title="System guide"
        className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
        type="button"
      >
        <span className="material-symbols-outlined">help</span>
      </button>

      {showHelp ? (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container"
              type="button"
              aria-label="Close help"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h3 className="font-headline-md text-[20px] font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">contact_support</span>
              MaaSheba Operations Support
            </h3>
            <div className="space-y-4 text-sm leading-relaxed text-on-surface-variant font-body-md">
              <p>This workspace is configured for maternal health operations, worker approval, sync review, and reporting.</p>
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/60 text-xs">
                <p className="font-bold text-on-surface">Support Hotline</p>
                <p className="mt-1 font-semibold flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-[14px]">phone</span>
                  +880 1700-112233
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showToast ? (
        <div className="fixed bottom-4 right-4 bg-primary text-on-primary border border-outline-variant/10 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 font-label-lg text-sm font-semibold select-none">
          <span className="material-symbols-outlined text-[20px]">cloud_done</span>
          <span>Data synced successfully with Supabase storage.</span>
        </div>
      ) : null}
    </div>
  );
}

function NotificationItem({ icon, tone, title, body, time }: { icon: string; tone: string; title: string; body: string; time: string }) {
  return (
    <div className="px-4 py-3 hover:bg-surface-container-low transition-colors flex gap-2">
      <span className={`material-symbols-outlined ${tone} text-[18px] shrink-0 mt-0.5`}>{icon}</span>
      <div>
        <p className="font-semibold text-xs">{title}</p>
        <p className="text-[11px] text-on-surface-variant leading-tight mt-0.5">{body}</p>
        <span className="text-[9px] text-on-surface-variant/70 block mt-1 font-semibold">{time}</span>
      </div>
    </div>
  );
}
