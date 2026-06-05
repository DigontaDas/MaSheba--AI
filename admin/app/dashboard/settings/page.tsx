"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [autoSms, setAutoSms] = useState(true);
  const [ivrEscalation, setIvrEscalation] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState([
    {
      id: "doc-1",
      name: "WHO_Maternal_Care_Guidelines_2024.pdf",
      time: "Indexed: 2 days ago • 12.4 MB",
    },
    {
      id: "doc-2",
      name: "Regional_Nutrition_Protocols_Q1.pdf",
      time: "Indexed: 15 days ago • 4.1 MB",
    },
  ]);

  function handleSave() {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  }

  function handleDeleteDocument(id: string) {
    setDocuments(documents.filter((doc) => doc.id !== id));
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploading(false);
            setDocuments((prevDocs) => [
              ...prevDocs,
              {
                id: `doc-${Date.now()}`,
                name: file.name,
                time: `Indexed: Just now • ${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              },
            ]);
          }, 300);
          return 100;
        }
        return prev + 30;
      });
    }, 300);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            System Configuration & Guidelines
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage AI content layers, synchronization engines, and low-connectivity fallbacks.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/audit"
            className="bg-surface border border-outline-variant text-on-surface px-6 py-2 rounded-full font-label-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors h-tap-target-min cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">history</span>
            Audit Logs
          </Link>
          <button
            onClick={handleSave}
            className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-surface-tint transition-colors h-tap-target-min shadow-sm cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {isSaved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: AI & Guidelines (Spans 2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI RAG Content Manager */}
          <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col h-full shadow-sm">
            <div className="bg-surface-container-lowest border-b border-outline-variant px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-on-primary" data-weight="fill">
                    menu_book
                  </span>
                </div>
                <h3 className="font-headline-md text-[18px] font-bold text-on-surface">
                  AI Health Guidelines (RAG Knowledge Source)
                </h3>
              </div>
              <span className="bg-primary-container/20 text-primary px-3 py-1 rounded-full font-label-sm text-xs font-bold border border-primary-container/50">
                v2.4 Active
              </span>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6">
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Upload or manage the reference medical documents and local guidelines. These are indexed into the RAG vector space used by the MaaSheba AI maternal copilot app.
              </p>
              
              {/* File upload container */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx"
                className="hidden"
              />
              <div
                onClick={handleUploadClick}
                className="border border-dashed border-outline-variant rounded-lg p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer group select-none"
              >
                {uploading ? (
                  <div className="flex flex-col items-center w-full max-w-[200px]">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2 animate-spin">
                      sync
                    </span>
                    <span className="font-label-lg text-primary font-bold text-sm">
                      Uploading ({uploadProgress}%)
                    </span>
                    <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl text-primary mb-2 transition-transform group-hover:scale-105">
                      cloud_upload
                    </span>
                    <span className="font-label-lg text-primary font-bold">
                      Upload New Guidelines PDF
                    </span>
                    <span className="font-label-sm text-on-surface-variant text-xs mt-1">
                      Supports PDF, DOCX (Max 50MB)
                    </span>
                  </>
                )}
              </div>

              {/* Indexed document catalog */}
              <div className="space-y-3">
                <h4 className="font-label-lg text-label-lg font-bold text-on-surface">
                  Indexed Guidelines Files
                </h4>
                
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-outline-variant rounded-lg bg-surface-container-lowest shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="material-symbols-outlined text-error text-[24px]">
                        picture_as_pdf
                      </span>
                      <div className="min-w-0">
                        <p className="font-label-lg text-sm font-bold text-on-surface truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-on-surface-variant font-semibold mt-0.5">
                          {doc.time}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-on-surface-variant hover:text-error p-2 rounded-full h-10 w-10 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}

                {documents.length === 0 && (
                  <p className="text-xs text-on-surface-variant/80 italic text-center py-4 bg-surface-container-low rounded-lg">
                    No guidelines documents indexed yet.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Col 2: Health Monitor & Fallbacks */}
        <div className="space-y-6">
          {/* Technical Health Monitor */}
          <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="bg-surface-container-lowest border-b border-outline-variant px-6 py-4">
              <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" data-weight="fill">
                  monitor_heart
                </span>
                System Health Monitor
              </h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <div className="flex justify-between items-end mb-1 text-sm font-semibold">
                  <span className="text-on-surface">Supabase Sync Engine</span>
                  <span className="text-primary flex items-center gap-1 font-bold">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Online
                  </span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "100%" }}></div>
                </div>
                <p className="text-[10px] text-on-surface-variant/80 mt-1 text-right">
                  Last verified sync: 2 mins ago
                </p>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1 text-sm font-semibold">
                  <span className="text-on-surface">P95 API Latency</span>
                  <span className="text-on-surface-variant">142ms</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2">
                  <div className="bg-primary-container h-2 rounded-full" style={{ width: "45%" }}></div>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/60 flex justify-between items-center">
                <span className="text-sm font-bold text-on-surface">Server Database Load</span>
                <span className="font-headline-lg text-lg text-on-surface font-bold">24%</span>
              </div>
            </div>
          </section>

          {/* SMS/IVR Fallbacks */}
          <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="bg-surface-container-lowest border-b border-outline-variant px-6 py-4">
              <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary" data-weight="fill">
                  cell_tower
                </span>
                Connectivity Fallbacks
              </h3>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Configure triggers for low-connectivity environments where mobile data connection is unavailable.
              </p>

              {/* Toggle 1 */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center h-5 mt-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={autoSms}
                    onChange={(e) => setAutoSms(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-5 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </div>
                <div>
                  <span className="font-label-lg text-sm font-bold text-on-surface block group-hover:text-primary transition-colors">
                    Auto-SMS Sync Failure
                  </span>
                  <span className="text-xs text-on-surface-variant mt-0.5 block leading-normal">
                    Send critical appointments via SMS if data sync fails for &gt; 24hrs.
                  </span>
                </div>
              </label>

              <div className="h-px w-full bg-outline-variant/50"></div>

              {/* Toggle 2 */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center h-5 mt-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={ivrEscalation}
                    onChange={(e) => setIvrEscalation(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-5 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </div>
                <div>
                  <span className="font-label-lg text-sm font-bold text-on-surface block group-hover:text-primary transition-colors">
                    IVR Escalation Triggers
                  </span>
                  <span className="text-xs text-on-surface-variant mt-0.5 block leading-normal">
                    Trigger automated voice calls for red-flag symptoms if worker is offline.
                  </span>
                </div>
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
