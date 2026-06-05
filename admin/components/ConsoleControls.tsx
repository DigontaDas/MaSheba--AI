"use client";

import { useEffect, useState, useRef } from "react";

export function ConsoleControls() {
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(true);

  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("maasheba.admin.language");
    if (storedLanguage === "bn" || storedLanguage === "en") {
      setLanguage(storedLanguage);
      document.documentElement.lang = storedLanguage;
      return;
    }

    const match = document.cookie.match(/(^| )maasheba_lang=([^;]+)/);
    if (match && (match[2] === "en" || match[2] === "bn")) {
      setLanguage(match[2] as "en" | "bn");
      document.documentElement.lang = match[2];
    }
  }, []);

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function updateLanguage(next: "en" | "bn") {
    setLanguage(next);
    window.localStorage.setItem("maasheba.admin.language", next);
    document.documentElement.lang = next;
    document.cookie = `maasheba_lang=${next}; path=/; max-age=31536000`;
    window.location.reload();
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
    <div className="flex items-center gap-2 relative">
      {/* 1. Language Toggle */}
      <button
        onClick={() => updateLanguage(language === "en" ? "bn" : "en")}
        className="flex items-center gap-1.5 rounded-full border border-outline bg-surface px-3 h-10 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
        type="button"
        title="Switch language"
      >
        <span className="material-symbols-outlined text-[18px]">language</span>
        <span>{language === "en" ? "বাংলা" : "EN"}</span>
      </button>

      <div className="h-6 w-px bg-outline-variant mx-1"></div>

      {/* 2. Sync Data Button */}
      <button
        onClick={handleSync}
        aria-label="Sync Data"
        title="Sync Data"
        disabled={isSyncing}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer ${
          isSyncing ? "text-primary opacity-60" : ""
        }`}
      >
        <span className={`material-symbols-outlined ${isSyncing ? "animate-spin" : ""}`}>
          sync
        </span>
      </button>

      {/* 3. Notifications Button & Dropdown */}
      <div className="relative" ref={notificationRef}>
        <button
          onClick={() => {
            setShowNotifications(!showNotifications);
            setUnreadNotifications(false);
          }}
          aria-label="Notifications"
          title="Notifications"
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors relative cursor-pointer"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadNotifications && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error border-2 border-surface rounded-full"></span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-surface border border-outline-variant rounded-xl shadow-lg z-30 py-2 text-sm font-body-md text-on-surface">
            <div className="px-4 py-2 border-b border-outline-variant/60 bg-surface-container-lowest font-bold text-xs uppercase tracking-wider text-on-surface-variant flex justify-between items-center">
              <span>System Alerts</span>
              <button 
                onClick={() => setUnreadNotifications(false)}
                className="text-[10px] text-primary hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant/40">
              <div className="px-4 py-3 hover:bg-surface-container-low transition-colors flex gap-2">
                <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">error</span>
                <div>
                  <p className="font-semibold text-xs">SMS Send Failure</p>
                  <p className="text-[11px] text-on-surface-variant leading-tight mt-0.5">
                    Critical warning alert message to CHW_B (+8801723456789) failed.
                  </p>
                  <span className="text-[9px] text-on-surface-variant/70 block mt-1 font-semibold">12 mins ago</span>
                </div>
              </div>
              <div className="px-4 py-3 hover:bg-surface-container-low transition-colors flex gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <div>
                  <p className="font-semibold text-xs">Supabase Sync Successful</p>
                  <p className="text-[11px] text-on-surface-variant leading-tight mt-0.5">
                    Sync completed. 6 regional upazila records successfully updated.
                  </p>
                  <span className="text-[9px] text-on-surface-variant/70 block mt-1 font-semibold">Just now</span>
                </div>
              </div>
              <div className="px-4 py-3 hover:bg-surface-container-low transition-colors flex gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">verified_user</span>
                <div>
                  <p className="font-semibold text-xs">Admin Login Detected</p>
                  <p className="text-[11px] text-on-surface-variant leading-tight mt-0.5">
                    New session established from IP 103.220.x.x
                  </p>
                  <span className="text-[9px] text-on-surface-variant/70 block mt-1 font-semibold">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Help Button */}
      <button
        onClick={() => setShowHelp(true)}
        aria-label="Help"
        title="System Guide"
        className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined">help</span>
      </button>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h3 className="font-headline-md text-[20px] font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">contact_support</span>
              MaaSheba Operations Support
            </h3>
            <div className="space-y-4 text-sm leading-relaxed text-on-surface-variant font-body-md">
              <p>
                Welcome to the MaaSheba Admin Console. This workspace is configured in <strong>Offline Synchronization Mode</strong>.
              </p>
              <div>
                <h4 className="font-bold text-on-surface mb-1">Frequently Used Operations:</h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Bilingual Q&A</strong>: Update mobile FAQ catalogs synced with field worker apps.</li>
                  <li><strong>MFA Toggles</strong>: Toggle worker statuses in the CHW Directory panel.</li>
                  <li><strong>CSV/PDF Reports</strong>: Download pregnancy registries in the Exports panel.</li>
                </ul>
              </div>
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/60 text-xs">
                <p className="font-bold text-on-surface">Need help? Support Hotline:</p>
                <p className="mt-1 font-semibold flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-[14px]">phone</span>
                  +880 1700-112233
                </p>
                <p className="text-[10px] text-on-surface-variant/80 mt-1">Available 24/7 for regional coordinators.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Success Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-primary text-on-primary border border-outline-variant/10 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-in slide-in-from-bottom-6 duration-300 font-label-lg text-sm font-semibold select-none">
          <span className="material-symbols-outlined text-[20px]">cloud_done</span>
          <span>Data synced successfully with Supabase storage.</span>
        </div>
      )}
    </div>
  );
}
