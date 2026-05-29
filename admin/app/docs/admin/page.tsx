import { revalidatePath } from "next/cache";
import { AdminPanelClient, type DocsAdminConfigPayload } from "./AdminPanelClient";
import { promises as fs } from "fs";
import path from "path";
import { type FeatureRow, type TeamMember } from "../DocsView";

export const dynamic = "force-dynamic";

const defaultTeam: TeamMember[] = [
  { name: "Mihir Das", role: "UI/UX Design", email: "mihir@example.com", initials: "MD" },
  { name: "Mehedi Hasan Nafis", role: "Backend Engineering", email: "nafis@example.com", initials: "MN" },
  { name: "Fayaz Bin Faruk", role: "Data Science / Business Analytics", email: "fayaz@example.com", initials: "FF" },
  { name: "Hasnain Ashraf", role: "Presentation & Communication", email: "hasnain@example.com", initials: "HA" },
  { name: "Digonta Das", role: "Project Manager", email: "digonta@example.com", initials: "DD" },
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

const defaultConfig = {
  is_public: true,
  start_at: "2026-06-10T00:00:00+06:00",
  end_at: "2026-06-14T23:59:59+06:00",
  youtube_url: "https://www.youtube.com/embed/demo",
  team_members: defaultTeam,
  feature_matrix: defaultFeatures,
};

function hasSupabaseConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function isAdminUser(user: any) {
  if (!user) return false;
  const role = user?.app_metadata?.role ?? user?.user_metadata?.role;
  const roles = user?.app_metadata?.roles ?? user?.user_metadata?.roles;
  return role === "admin" || (Array.isArray(roles) && roles.includes("admin"));
}

export default async function DocsAdminPage() {
  let hasSupabase = hasSupabaseConfig();
  let initialConfig = null;
  let initialIsAdmin = false;

  if (hasSupabase) {
    try {
      const { createAdminClient, createServerSupabaseClient } = await import("@/utils/supabase/server");
      const authClient = createServerSupabaseClient();
      const adminClient = createAdminClient();
      
      const { data: { user } } = await authClient.auth.getUser();
      initialIsAdmin = isAdminUser(user);
      
      const { data } = await adminClient.from("docs_config").select("*").eq("id", 1).maybeSingle();
      initialConfig = data;
    } catch {
      hasSupabase = false; // Fall back to local JSON if Supabase fails
    }
  }

  // Load from local config if not using Supabase or if Supabase load failed
  if (!hasSupabase) {
    try {
      const filePath = path.join(process.cwd(), "docs_config.json");
      const fileContent = await fs.readFile(filePath, "utf8");
      initialConfig = JSON.parse(fileContent);
    } catch {
      initialConfig = defaultConfig;
    }
  }

  async function saveDocsConfig(payload: DocsAdminConfigPayload, mode: "draft" | "publish") {
    "use server";

    const draftConfig = {
      is_public: payload.is_public,
      start_at: payload.start_at,
      end_at: payload.end_at,
      youtube_url: payload.youtube_url,
      team_members: payload.team_members,
      feature_matrix: payload.feature_matrix,
    };

    const update =
      mode === "draft"
        ? { draft_config: draftConfig, updated_at: new Date().toISOString() }
        : { ...draftConfig, draft_config: null, updated_at: new Date().toISOString() };

    // Save locally to JSON file
    if (!hasSupabaseConfig()) {
      try {
        const filePath = path.join(process.cwd(), "docs_config.json");
        let currentConfig = {};
        try {
          const content = await fs.readFile(filePath, "utf8");
          currentConfig = JSON.parse(content);
        } catch {}

        const newConfig = { ...currentConfig, ...update };
        await fs.writeFile(filePath, JSON.stringify(newConfig, null, 2), "utf8");

        revalidatePath("/docs");
        revalidatePath("/docs/admin");
        return { ok: true, message: mode === "draft" ? "Draft saved locally." : "Published locally. Public access updates instantly." };
      } catch (e: any) {
        return { ok: false, message: "Failed to save local config: " + e.message };
      }
    }

    // Save to Supabase database
    try {
      const { createAdminClient, createServerSupabaseClient } = await import("@/utils/supabase/server");
      const serverAuthClient = createServerSupabaseClient();
      const serverAdminClient = createAdminClient();
      const { data: { user: currentUser } } = await serverAuthClient.auth.getUser();

      if (!isAdminUser(currentUser)) {
        return { ok: false, message: "Access denied. Admin role required." };
      }

      const { error } = await serverAdminClient.from("docs_config").upsert({ id: 1, ...update });

      if (error) {
        return { ok: false, message: error.message };
      }

      revalidatePath("/docs");
      revalidatePath("/docs/admin");
      return { ok: true, message: mode === "draft" ? "Draft saved." : "Published. Public access updates instantly." };
    } catch (e: any) {
      return { ok: false, message: "Failed to save to database: " + e.message };
    }
  }

  async function verifyLocalLogin(emailInput: string, passwordInput: string) {
    "use server";
    if (emailInput === "admin@masheba.ai" && passwordInput === "masheba2026") {
      return { ok: true, message: "Logged in successfully." };
    }
    return { ok: false, message: "Invalid credentials. Use admin@masheba.ai / masheba2026." };
  }

  return (
    <AdminPanelClient
      initialConfig={initialConfig}
      initialIsAdmin={initialIsAdmin}
      saveDocsConfig={saveDocsConfig}
      verifyLocalLogin={verifyLocalLogin}
      hasSupabase={hasSupabase}
    />
  );
}
