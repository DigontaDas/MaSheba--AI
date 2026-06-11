"use client";

import { useMemo, useState, useTransition } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { FeatureRow, TeamMember } from "../DocsView";

export type DocsAdminConfigPayload = {
  is_public: boolean;
  start_at: string;
  end_at: string;
  youtube_url: string;
  team_members: TeamMember[];
  feature_matrix: FeatureRow[];
};

type DocsConfig = DocsAdminConfigPayload & {
  draft_config?: Partial<DocsAdminConfigPayload> | null;
};

type SaveResult = {
  ok: boolean;
  message: string;
};

type AdminPanelClientProps = {
  initialConfig: DocsConfig | null;
  initialIsAdmin: boolean;
  saveDocsConfig: (payload: DocsAdminConfigPayload, mode: "draft" | "publish") => Promise<SaveResult>;
  verifyLocalLogin?: (email: string, password: string) => Promise<SaveResult>;
  hasSupabase?: boolean;
  supabaseError?: string;
};

const defaultTeam: TeamMember[] = [
  { name: "Mihir Das", role: "UI/UX Design", email: "dasmihir2911@gmail.com", initials: "MD", avatar_url: "/mihir.png" },
  { name: "Mehedi Hasan Nafis", role: "Backend Engineering", email: "nafismehedi37@gmail.com", initials: "MN", avatar_url: "/nafis.jpg" },
  { name: "Fayaz Bin Faruk", role: "Data Science / Business Analytics", email: "fayazcr79@gmail.com", initials: "FF", avatar_url: "/fayaz.png" },
  { name: "Hasnain Ashraf", role: "Presentation & Communication", email: "hasnainashraf003@gmail.com", initials: "HA", avatar_url: "/hasnain.jpg" },
  { name: "Digonta Das", role: "Project Manager", email: "digontadas0171@gmail.com", initials: "DD", avatar_url: "/digonta.jpg" },
];

const defaultFeatures: FeatureRow[] = [
  { feature: "Offline risk assessment", status: "Live", notes: "On-device intake and risk badge for CHW visits." },
  { feature: "ONNX model", status: "Live", notes: "XGBoost model packaged for low-end Android inference." },
  { feature: "Outbox sync", status: "Live", notes: "SQLite WAL queue retries events when connectivity returns." },
  { feature: "Bangla AI chat", status: "Live", notes: "Groq-first LLM cascade with Gemini fallback and local safety checks." },
  { feature: "Offline Q&A", status: "Live", notes: "Seeded maternal health answers available without network." },
  { feature: "Medicine verify", status: "Live", notes: "Offline medicine and dosage guidance workflow." },
  { feature: "FCM push", status: "Live", notes: "Push alerts for care reminders and admin broadcasts." },
  { feature: "Admin dashboard", status: "Live", notes: "Next.js dashboard with Supabase analytics views." },
  { feature: "Emergency auto-referral", status: "Live", notes: "Keyword detection triggers hospital referral alert." },
  { feature: "Nutrition guidance", status: "Live", notes: "Trimester-specific dietary recommendations." },
  { feature: "Mother dashboard", status: "Live", notes: "Personal pregnancy progress tracker and visit history." },
  { feature: "Emergency Callout Panel", status: "Live", notes: "AUTO-refresh HIGH risk panel on admin dashboard." },
  { feature: "Interactive Map Focus", status: "Live", notes: "Click-to-fly map centering on patient GPS coords." },
  { feature: "Telemetry Log Viewer", status: "Live", notes: "Color-coded SMS failure log with severity tabs." },
  { feature: "CHW Certificate Proxy", status: "Live", notes: "Signed URL proxy for private RLS bucket downloads." },
  { feature: "CHW Reviews", status: "Live", notes: "Mother-submitted CHW ratings with admin moderation." },
  { feature: "CHW Reassignment", status: "Live", notes: "Mother-initiated CHW change with admin workflow." },
  { feature: "Push Notifications", status: "Live", notes: "Expo tokens, DB triggers, notification processor." },
  { feature: "Hospital Registry", status: "Live", notes: "PostGIS nearby search RPC + seed hospitals deployed." },
  { feature: "Full RAG pipeline", status: "Planned", notes: "WHO and DGHS guideline chunks embedded in pgvector." },
  { feature: "Whisper voice input", status: "Planned", notes: "Bangla voice capture for hands-free CHW intake." },
  { feature: "Coqui TTS", status: "Planned", notes: "Audio guidance for low-literacy mother journeys." },
  { feature: "SMS/IVR alerts", status: "Planned", notes: "Fallback alerts for households without data connectivity." },
  { feature: "Geographic heat maps", status: "Planned", notes: "Upazila-level risk and compliance visualization." },
  { feature: "On-device LLM", status: "Planned", notes: "Fine-tuned Llama 3.1 8B in GGUF 4-bit format." },
];

function toDatetimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
}

export function AdminPanelClient({
  initialConfig,
  initialIsAdmin,
  saveDocsConfig,
  verifyLocalLogin,
  hasSupabase = true,
  supabaseError,
}: AdminPanelClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (hasSupabase) {
      try {
        return createClient();
      } catch {
        return null;
      }
    }
    return null;
  }, [hasSupabase]);

  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const draft = initialConfig?.draft_config ?? null;
  const source = { ...initialConfig, ...draft };

  const [isPublic, setIsPublic] = useState(source?.is_public ?? true);
  const [startAt, setStartAt] = useState(toDatetimeLocal(source?.start_at) || "2026-06-10T00:00");
  const [endAt, setEndAt] = useState(toDatetimeLocal(source?.end_at) || "2026-06-14T23:59");
  const [youtubeUrl, setYoutubeUrl] = useState(source?.youtube_url ?? "https://youtu.be/7gTyzUfNzds");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(source?.team_members ?? defaultTeam);
  const [featureJson, setFeatureJson] = useState(JSON.stringify(source?.feature_matrix ?? defaultFeatures, null, 2));

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!hasSupabase) {
      if (verifyLocalLogin) {
        startTransition(async () => {
          const result = await verifyLocalLogin(email, password);
          if (result.ok) {
            setIsAdmin(true);
            router.refresh();
          } else {
            setMessage(result.message);
          }
        });
      }
      return;
    }

    if (!supabase) {
      setMessage("Supabase client not initialized.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }

    const role = data.user?.app_metadata?.role ?? data.user?.user_metadata?.role;
    const roles = data.user?.app_metadata?.roles ?? data.user?.user_metadata?.roles;
    const hasAdminRole = role === "admin" || (Array.isArray(roles) && roles.includes("admin"));
    if (!hasAdminRole) {
      await supabase.auth.signOut();
      setMessage("Access denied. Admin role required.");
      return;
    }

    setIsAdmin(true);
    router.refresh();
  }

  async function handleLogout() {
    if (hasSupabase && supabase) {
      await supabase.auth.signOut();
    }
    setIsAdmin(false);
    router.refresh();
  }

  function updateMember(index: number, field: "name" | "email", value: string) {
    setTeamMembers((members) =>
      members.map((member, memberIndex) =>
        memberIndex === index
          ? { ...member, [field]: value, initials: field === "name" ? initials(value) : member.initials }
          : member,
      ),
    );
  }

  function submit(mode: "draft" | "publish") {
    setMessage("");
    let features: FeatureRow[];
    try {
      features = JSON.parse(featureJson);
      if (!Array.isArray(features)) throw new Error("Feature matrix must be an array.");
    } catch (error: any) {
      setMessage(error.message ?? "Feature matrix JSON is invalid.");
      return;
    }

    const start = new Date(startAt);
    const end = new Date(endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      setMessage("Enter a valid start and end time. Start must be before end.");
      return;
    }

    const payload: DocsAdminConfigPayload = {
      is_public: isPublic,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      youtube_url: youtubeUrl,
      team_members: teamMembers,
      feature_matrix: features,
    };

    startTransition(async () => {
      const result = await saveDocsConfig(payload, mode);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <VideoBanner />
        <div className="flex items-center justify-center px-6 py-10">
        <form onSubmit={handleLogin} className="w-full max-w-md rounded-md border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm font-semibold text-emerald-300">MaaSheba AI</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Docs Admin</h1>
          <div className="mt-6 space-y-4">
            <Field label="Email">
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="input" />
            </Field>
            <Field label="Password">
              <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="input" />
            </Field>
          </div>
          
          {!hasSupabase && (
            <div className="mt-4 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 leading-relaxed">
              <span className="font-semibold block mb-1">Demo Credentials:</span>
              Email: <strong className="text-white">admin@masheba.ai</strong><br />
              Password: <strong className="text-white">masheba2026</strong>
            </div>
          )}

          {message ? <p className="mt-4 rounded-md border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{message}</p> : null}
          
          <button disabled={isPending} className="mt-6 w-full rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60">
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <VideoBanner />
      <div className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              MaaSheba AI
            </p>
            <h1 className="text-2xl font-semibold text-white">Documentation Settings</h1>
          </div>
          <div className="flex gap-2">
            <a href="https://maasheba-admin.vercel.app/login" target="_blank" rel="noopener noreferrer" className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">Live Admin Panel</a>
            <a href="/docs" className="rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-900">View docs</a>
            <button onClick={handleLogout} className="rounded-md border border-rose-400/30 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-400/10">Sign out</button>
          </div>
        </header>

        {message ? <p className="mt-5 rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-slate-200">{message}</p> : null}


        <section className="mt-6 space-y-6 rounded-md border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-4 rounded-md border border-slate-800 bg-slate-950 p-4">
            <div>
              <h2 className="font-semibold text-white">Public visibility</h2>
              <p className="mt-1 text-sm text-slate-400">Publishing this toggle takes effect instantly.</p>
            </div>
            <button
              onClick={() => setIsPublic((value) => !value)}
              className={`h-7 w-12 rounded-full p-1 transition ${isPublic ? "bg-emerald-400" : "bg-slate-700"}`}
              aria-pressed={isPublic}
            >
              <span className={`block h-5 w-5 rounded-full bg-white transition ${isPublic ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Start at">
              <input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="input" />
            </Field>
            <Field label="End at">
              <input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className="input" />
            </Field>
          </div>

          <Field label="YouTube demo video URL">
            <input type="url" value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} className="input" />
          </Field>

          <div>
            <h2 className="text-base font-semibold text-white">Team Members</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {teamMembers.map((member, index) => (
                <div key={member.role} className="rounded-md border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-emerald-300">{member.role}</p>
                  <div className="mt-3 grid gap-3">
                    <input value={member.name} onChange={(event) => updateMember(index, "name", event.target.value)} className="input" />
                    <input type="email" value={member.email} onChange={(event) => updateMember(index, "email", event.target.value)} className="input" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Field label="Feature matrix override JSON">
            <textarea value={featureJson} onChange={(event) => setFeatureJson(event.target.value)} rows={10} className="input font-mono text-xs" />
          </Field>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button disabled={isPending} onClick={() => submit("draft")} className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
              Save draft
            </button>
            <button disabled={isPending} onClick={() => submit("publish")} className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60">
              Publish
            </button>
          </div>
        </section>
      </div>
      </div>
    </main>
  );
}

/* ── Video Banner ─────────────────────────────────────────────────── */
function VideoBanner() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        background: "#000",
        overflow: "hidden",
      }}
    >
      {/* Cinematic header bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)",
          padding: "18px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.png"
            alt="MaaSheba AI"
            width={28}
            height={28}
            style={{ borderRadius: 6, flexShrink: 0 }}
          />
          <div>
            <span
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: -0.3,
              }}
            >
              MaaSheba AI
            </span>
            <span
              style={{
                display: "block",
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                fontFamily: "monospace",
                letterSpacing: 0.5,
              }}
            >
              মা-সেবা · Live Product Demo
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(0,212,170,0.18)",
              border: "1px solid rgba(0,212,170,0.4)",
              color: "#00d4aa",
              fontSize: 11,
              fontFamily: "monospace",
              padding: "3px 10px",
              borderRadius: 20,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#00d4aa",
                display: "inline-block",
                animation: "pulse 2s infinite",
              }}
            />
            Autoplay · Muted
          </span>
          <a
            href="https://drive.usercontent.google.com/download?id=1wbtQKfZaXLzkXWx3RXm3gzczs9bzhfaM&export=download&authuser=1"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              fontSize: 11,
              fontFamily: "monospace",
              padding: "3px 10px",
              borderRadius: 20,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            ⬇ Download MP4
          </a>
          <a
            href="https://maasheba-admin.vercel.app/login"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(0,212,170,0.18)",
              border: "1px solid rgba(0,212,170,0.4)",
              color: "#00d4aa",
              fontSize: 11,
              fontFamily: "monospace",
              padding: "3px 10px",
              borderRadius: 20,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            ⚙️ Live Admin Panel
          </a>
        </div>
      </div>

      {/* YouTube looping embed */}
      <div style={{ position: "relative", paddingTop: "42.25%" /* 21:9 cinematic */ }}>
        <iframe
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
          src="https://www.youtube.com/embed/7gTyzUfNzds?autoplay=1&mute=1&loop=1&playlist=7gTyzUfNzds&controls=0&disablekb=1&modestbranding=1&rel=0&showinfo=0"
          title="MaaSheba AI — Product Demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Bottom gradient fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "linear-gradient(to top, #020617 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-normal text-slate-400">{label}</span>
      {children}
    </label>
  );
}
