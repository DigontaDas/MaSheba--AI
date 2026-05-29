import { DocsView, type FeatureRow, type TeamMember } from "./DocsView";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

type DocsConfig = {
  is_public: boolean;
  start_at: string;
  end_at: string;
  youtube_url: string | null;
  team_members: TeamMember[] | null;
  feature_matrix: FeatureRow[] | null;
};

const defaultTeam: TeamMember[] = [
  { name: "Mihir Das", role: "UI/UX Design", email: "mihir@example.com", initials: "MD" },
  { name: "Mehedi Hasan Nafis", role: "Backend Engineering", email: "nafis@example.com", initials: "MN" },
  { name: "Fayaz Bin Faruk", role: "Data Science / Business Analytics", email: "fayaz@example.com", initials: "FF" },
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
  { feature: "Full RAG pipeline", status: "Planned", notes: "WHO and DGHS guideline chunks embedded in pgvector." },
  { feature: "Whisper voice input", status: "Planned", notes: "Bangla voice capture for hands-free CHW intake." },
  { feature: "Coqui TTS", status: "Planned", notes: "Audio guidance for low-literacy mother journeys." },
  { feature: "SMS/IVR alerts", status: "Planned", notes: "Fallback alerts for households without data connectivity." },
  { feature: "Geographic heat maps", status: "Planned", notes: "Upazila-level risk and compliance visualization." },
  { feature: "On-device LLM", status: "Planned", notes: "Fine-tuned Llama 3.1 8B in GGUF 4-bit format." },
];

const defaultConfig: DocsConfig = {
  is_public: true,
  start_at: "2026-05-01T00:00:00+06:00",
  end_at: "2026-12-31T23:59:59+06:00",
  youtube_url: "https://www.youtube.com/embed/demo",
  team_members: defaultTeam,
  feature_matrix: defaultFeatures,
};

/** Check if Supabase env vars are available */
function hasSupabaseConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function getLocalConfig(): Promise<DocsConfig | null> {
  try {
    const filePath = path.join(process.cwd(), "docs_config.json");
    console.log("[getLocalConfig] Reading path:", filePath);
    const fileContent = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(fileContent);
    console.log("[getLocalConfig] Loaded config is_public:", parsed.is_public, "start_at:", parsed.start_at);
    return parsed;
  } catch (e: any) {
    console.error("[getLocalConfig] Failed to load config:", e.message);
    return null;
  }
}

async function getConfig(): Promise<{ config: DocsConfig; features: FeatureRow[] }> {
  // Try reading from local JSON config first
  const localConfig = await getLocalConfig();

  // If Supabase is not configured, use local JSON or hardcoded defaults
  if (!hasSupabaseConfig()) {
    const config = localConfig ?? defaultConfig;
    return { config, features: config.feature_matrix ?? defaultFeatures };
  }

  try {
    const { createAdminClient } = await import("@/utils/supabase/server");
    const supabase = createAdminClient();

    // Fetch docs config
    const { data: configData } = await supabase
      .from("docs_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    const config = (configData as DocsConfig | null) ?? defaultConfig;

    // Fetch features from Supabase features table
    const { data: featureData, error: featureError } = await supabase
      .from("features")
      .select("feature,status,notes")
      .order("feature", { ascending: true });

    let features: FeatureRow[];
    if (featureError || !featureData?.length) {
      features = config.feature_matrix ?? defaultFeatures;
    } else {
      features = featureData
        .filter((row) => row.feature && row.status)
        .map((row) => ({
          feature: String(row.feature),
          status: row.status === "Planned" ? "Planned" : "Live",
          notes: String(row.notes ?? ""),
        })) as FeatureRow[];
    }

    return { config, features };
  } catch {
    // If Supabase call fails for any reason, fall back to defaults
    return { config: defaultConfig, features: defaultFeatures };
  }
}

export default async function DocsPage() {
  const { config, features } = await getConfig();
  const now = new Date();
  const startAt = new Date(config.start_at);
  const endAt = new Date(config.end_at);
  const isWithinWindow = now >= startAt && now <= endAt;
  const isAllowed = config.is_public && isWithinWindow;

  if (!isAllowed) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold uppercase tracking-normal text-rose-300">403</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white">
            Documentation not currently available
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Public access is controlled by the docs release window and admin visibility toggle.
          </p>
          <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-slate-400">
            Window: {startAt.toLocaleString()} to {endAt.toLocaleString()}
          </div>
          <a
            href="/docs/admin"
            className="mt-6 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Open admin panel
          </a>
        </div>
      </main>
    );
  }

  return (
    <DocsView
      youtubeUrl={config.youtube_url ?? defaultConfig.youtube_url!}
      teamMembers={config.team_members ?? defaultTeam}
      features={features}
      backendHealthUrl={`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://maasheba-backend.onrender.com"}/health`}
    />
  );
}
