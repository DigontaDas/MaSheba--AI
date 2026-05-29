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
  { feature: "Offline risk assessment", status: "Live", notes: "On-device risk badge." },
  { feature: "ONNX model", status: "Live", notes: "XGBoost ONNX package." },
  { feature: "Outbox sync", status: "Live", notes: "SQLite WAL queue and retry." },
  { feature: "Bangla AI chat", status: "Live", notes: "Groq to Gemini to offline cascade." },
  { feature: "Full RAG pipeline", status: "Planned", notes: "WHO/DGHS pgvector retrieval." },
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
  const [youtubeUrl, setYoutubeUrl] = useState(source?.youtube_url ?? "https://www.youtube.com/embed/jImLDadVTL0");
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
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
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
            <div className="mt-4 rounded-md border border-amber-500/25 bg-amber-500/5 p-4 text-xs text-amber-200/90 leading-relaxed space-y-3">
              <div>
                <span className="font-bold text-amber-400 block mb-1 flex items-center gap-1.5">
                  <span className="text-sm">⚠️</span> Running in Local Demo Mode
                </span>
                <p>
                  Database (Supabase) integration is unconfigured. Settings edits are kept in temporary memory and <strong>will reset upon browser refresh or serverless instance recycle</strong>.
                </p>
                {supabaseError && (
                  <div className="mt-2 rounded bg-rose-950/40 p-2 border border-rose-900/35">
                    <p className="font-semibold text-rose-300 mb-0.5">Technical diagnostics:</p>
                    <p className="font-mono text-[10px] text-rose-200/90 break-words">{supabaseError}</p>
                  </div>
                )}
              </div>
              <div className="border-t border-amber-500/10 pt-2.5">
                <span className="font-semibold text-white block mb-1">Demo Credentials:</span>
                <div className="bg-slate-950/60 p-2 rounded border border-slate-800 space-y-1">
                  <p>Email: <strong className="text-emerald-400">admin@masheba.ai</strong></p>
                  <p>Password: <strong className="text-emerald-400">masheba2026</strong></p>
                </div>
              </div>
            </div>
          )}

          {message ? <p className="mt-4 rounded-md border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{message}</p> : null}
          
          <button disabled={isPending} className="mt-6 w-full rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60">
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <p className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              MaaSheba AI
              {!hasSupabase && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] border border-emerald-500/20 font-medium text-emerald-400">
                  Local Mode
                </span>
              )}
            </p>
            <h1 className="text-2xl font-semibold text-white">Documentation Settings</h1>
          </div>
          <div className="flex gap-2">
            <a href="/docs" className="rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-900">View docs</a>
            <button onClick={handleLogout} className="rounded-md border border-rose-400/30 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-400/10">Sign out</button>
          </div>
        </header>

        {message ? <p className="mt-5 rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-slate-200">{message}</p> : null}

        {!hasSupabase && (
          <div className="mt-6 rounded-md border border-amber-500/25 bg-amber-500/5 p-5 text-sm text-amber-200/90 leading-relaxed shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5 leading-none">⚠️</span>
              <div className="space-y-2.5">
                <h3 className="font-bold text-base text-amber-400">Database Connection Required for Persistence</h3>
                <p>
                  You are editing documentation settings in <strong>Local Mode</strong>. Vercel deployment containers are stateless and read-only. Any changes you make here (such as updating the YouTube demo video URL) are written to a temporary local file, which <strong>will reset back to the default demo video</strong> as soon as Vercel recycles the serverless instance or a new request routes to another instance.
                </p>
                <div className="text-xs text-slate-300 border-t border-amber-500/10 pt-3 mt-1.5 space-y-2">
                  <p className="font-semibold text-white">To restore full persistence and enable permanent saves:</p>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1">
                    <li>Go to your <strong>Vercel Project Dashboard</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.</li>
                    <li>Add these three environment variables pointing to your Supabase project:
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1.5 font-mono text-[11px] text-amber-300/80">
                        <div className="bg-slate-950/70 p-1.5 px-2.5 rounded border border-slate-800">
                          <code className="text-slate-400 block text-[9px] uppercase font-sans">Variable 1</code>
                          <code>NEXT_PUBLIC_SUPABASE_URL</code>
                        </div>
                        <div className="bg-slate-950/70 p-1.5 px-2.5 rounded border border-slate-800">
                          <code className="text-slate-400 block text-[9px] uppercase font-sans">Variable 2</code>
                          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>
                        </div>
                        <div className="bg-slate-950/70 p-1.5 px-2.5 rounded border border-slate-800">
                          <code className="text-slate-400 block text-[9px] uppercase font-sans">Variable 3</code>
                          <code>SUPABASE_SERVICE_ROLE_KEY</code>
                        </div>
                      </div>
                    </li>
                    <li className="mt-1">Redeploy your project on Vercel to load the environment variables.</li>
                  </ol>
                </div>
                {supabaseError && (
                  <details className="mt-3 text-xs bg-slate-950/40 border border-slate-900/60 rounded">
                    <summary className="cursor-pointer text-slate-400 hover:text-slate-300 font-semibold p-2 select-none focus:outline-none flex items-center gap-1.5">
                      <span className="text-[10px] transform transition-transform duration-200">&#9656;</span> Technical Diagnostics
                    </summary>
                    <div className="p-3 border-t border-slate-900/60 font-mono text-[11px] text-rose-300 bg-rose-950/10 break-words whitespace-pre-wrap">
                      {supabaseError}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

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
    </main>
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
