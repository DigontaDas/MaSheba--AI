import { revalidatePath } from "next/cache";
import { AdminPanelClient, type DocsAdminConfigPayload } from "./AdminPanelClient";

export const dynamic = "force-dynamic";

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
  if (!hasSupabaseConfig()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">Database Missing</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Admin Panel Disabled</h1>
          <p className="mt-4 text-sm text-slate-400">
            The documentation admin panel requires Supabase to be configured. 
            Currently, the application is running in local-only demo mode.
          </p>
          <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-slate-400 text-left">
            <p className="mb-2 font-semibold text-slate-300">Missing Environment Variables:</p>
            <ul className="list-inside list-disc">
              {!process.env.NEXT_PUBLIC_SUPABASE_URL && <li>NEXT_PUBLIC_SUPABASE_URL</li>}
              {!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && <li>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</li>}
              {!process.env.SUPABASE_SERVICE_ROLE_KEY && <li>SUPABASE_SERVICE_ROLE_KEY</li>}
            </ul>
          </div>
          <div className="mt-8 flex justify-center gap-4">
            <a href="/docs" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400">
              Go to Live Docs
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { createAdminClient, createServerSupabaseClient } = await import("@/utils/supabase/server");

  const authClient = createServerSupabaseClient();
  const adminClient = createAdminClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  const { data: config } = await adminClient.from("docs_config").select("*").eq("id", 1).maybeSingle();

  async function saveDocsConfig(payload: DocsAdminConfigPayload, mode: "draft" | "publish") {
    "use server";

    if (!hasSupabaseConfig()) {
      return { ok: false, message: "Supabase not configured." };
    }

    const { createAdminClient, createServerSupabaseClient } = await import("@/utils/supabase/server");
    const serverAuthClient = createServerSupabaseClient();
    const serverAdminClient = createAdminClient();
    const {
      data: { user: currentUser },
    } = await serverAuthClient.auth.getUser();

    if (!isAdminUser(currentUser)) {
      return { ok: false, message: "Access denied. Admin role required." };
    }

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

    const { error } = await serverAdminClient.from("docs_config").upsert({ id: 1, ...update });

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath("/docs");
    revalidatePath("/docs/admin");
    return { ok: true, message: mode === "draft" ? "Draft saved." : "Published. Public access updates instantly." };
  }

  return (
    <AdminPanelClient
      initialConfig={config}
      initialIsAdmin={isAdminUser(user)}
      saveDocsConfig={saveDocsConfig}
    />
  );
}
