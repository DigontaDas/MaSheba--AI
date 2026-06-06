import { LoginForm } from "@/app/login/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen bg-background flex items-center justify-center p-margin-mobile overflow-hidden">
      {/* Premium background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-xl grid md:grid-cols-2">
        {/* Left Branding Panel with Sleek Mesh Gradient */}
        <section className="relative flex flex-col justify-between p-8 min-h-[400px] bg-gradient-to-br from-surface-container to-surface overflow-hidden md:border-r border-outline-variant/30">
          {/* Glowing atmospheric circles */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[32px] text-primary" data-weight="fill">
                child_care
              </span>
              <p className="text-sm font-bold tracking-wider font-label-lg uppercase text-primary">
                MaaSheba AI
              </p>
            </div>
            <h1 
              className="mt-6 font-headline-lg text-headline-lg font-bold leading-tight text-on-surface text-balance"
              style={{ textWrap: "balance" }}
            >
              Maternal Care Admin Console
            </h1>
            <p 
              className="mt-4 font-body-md text-body-md text-on-surface-variant/90 text-sm leading-relaxed text-pretty"
              style={{ textWrap: "pretty" }}
            >
              Secure administrative access for community health worker coordination, real-time risk triage, offline QA manager, and system health telemetry.
            </p>
          </div>
          
          <div className="relative z-10 grid grid-cols-3 gap-3 text-sm mt-8 border-t border-outline-variant/30 pt-6">
            <div className="border-l-2 border-primary pl-3">
              <p className="font-label-lg text-label-lg font-bold text-on-surface">CHW</p>
              <p className="text-xs text-on-surface-variant">Registry</p>
            </div>
            <div className="border-l-2 border-primary pl-3">
              <p className="font-label-lg text-label-lg font-bold text-on-surface">Risk</p>
              <p className="text-xs text-on-surface-variant">Triage</p>
            </div>
            <div className="border-l-2 border-primary pl-3">
              <p className="font-label-lg text-label-lg font-bold text-on-surface">Audit</p>
              <p className="text-xs text-on-surface-variant">Ledger</p>
            </div>
          </div>
        </section>

        {/* Right Form Panel */}
        <section className="flex flex-col justify-center p-8 bg-surface-container-lowest">
          <h2 
            className="font-headline-md text-headline-md font-bold text-on-surface text-balance"
            style={{ textWrap: "balance" }}
          >
            Sign In
          </h2>
          <p 
            className="mt-2 font-body-md text-body-md text-on-surface-variant text-sm text-pretty"
            style={{ textWrap: "pretty" }}
          >
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
