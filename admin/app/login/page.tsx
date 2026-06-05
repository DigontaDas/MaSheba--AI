import { LoginForm } from "@/app/login/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-margin-mobile">
      <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm grid md:grid-cols-2">
        {/* Left Branding Panel */}
        <section className="flex flex-col justify-between bg-primary p-8 text-on-primary min-h-[400px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[32px]" data-weight="fill">
                child_care
              </span>
              <p className="text-sm font-semibold tracking-wider font-label-lg uppercase text-primary-fixed">
                MaaSheba AI
              </p>
            </div>
            <h1 className="mt-6 font-headline-lg text-headline-lg font-bold leading-tight">
              Maternal Care Admin Console
            </h1>
            <p className="mt-4 font-body-md text-body-md text-on-primary-container opacity-90 text-sm leading-relaxed">
              Secure administrative access for community health worker coordination, real-time risk triage, offline QA manager, and system health telemetry.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm mt-8 border-t border-primary-container/30 pt-6">
            <div className="border-l-2 border-primary-fixed pl-3">
              <p className="font-label-lg text-label-lg font-bold text-white">CHW</p>
              <p className="text-xs text-on-primary-container">Registry</p>
            </div>
            <div className="border-l-2 border-primary-fixed pl-3">
              <p className="font-label-lg text-label-lg font-bold text-white">Risk</p>
              <p className="text-xs text-on-primary-container">Triage</p>
            </div>
            <div className="border-l-2 border-primary-fixed pl-3">
              <p className="font-label-lg text-label-lg font-bold text-white">Audit</p>
              <p className="text-xs text-on-primary-container">Ledger</p>
            </div>
          </div>
        </section>

        {/* Right Form Panel */}
        <section className="flex flex-col justify-center p-8 bg-surface">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
            Sign In
          </h2>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant text-sm">
            Enter your credentials to access the secure Supabase administrative operations workspace.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
