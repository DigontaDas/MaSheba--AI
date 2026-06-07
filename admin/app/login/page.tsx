import { LoginForm } from "@/app/login/LoginForm";

export default function LoginPage() {
  return (
    // Force dark mode on the login page — always dark regardless of user preference
    <main className="dark relative min-h-screen flex items-center justify-center p-4 overflow-hidden" style={{ backgroundColor: "#0d1313" }}>

      {/* Atmospheric deep background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #00897b 0%, transparent 70%)" }} />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #00bcd4 0%, transparent 70%)" }} />
      </div>

      {/* Main card */}
      <div
        className="relative z-10 w-full max-w-[860px] overflow-hidden rounded-2xl grid md:grid-cols-2"
        style={{
          border: "1px solid rgba(78, 205, 196, 0.18)",
          boxShadow: "0 0 60px rgba(0,137,123,0.18), 0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* ─── Left Branding Panel ─── */}
        <section
          className="relative flex flex-col justify-between p-8 min-h-[400px] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #152020 0%, #0f1a1a 60%, #111e1e 100%)",
            borderRight: "1px solid rgba(78, 205, 196, 0.12)",
          }}
        >
          {/* Subtle mesh glow spots */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,137,123,0.15) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-16 -right-8 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,188,212,0.08) 0%, transparent 70%)" }} />

          {/* Top: Logo + Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <span
                className="material-symbols-outlined text-[28px]"
                data-weight="fill"
                style={{ color: "#4ecdc4" }}
              >
                child_care
              </span>
              <p
                className="text-xs font-bold tracking-[0.18em] uppercase"
                style={{ color: "#4ecdc4", fontFamily: "var(--font-work-sans)" }}
              >
                MaaSheba AI
              </p>
            </div>

            <h1
              className="mt-7 font-bold leading-tight text-balance"
              style={{
                color: "#e8f5f5",
                fontSize: "1.55rem",
                lineHeight: "1.3",
                fontFamily: "var(--font-hind-siliguri)",
              }}
            >
              Maternal Care Admin Console
            </h1>

            <p
              className="mt-4 text-sm leading-relaxed"
              style={{
                color: "rgba(195, 220, 220, 0.75)",
                fontFamily: "var(--font-hind-siliguri)",
                maxWidth: "90%",
              }}
            >
              Secure administrative access for community health worker coordination, real-time risk triage, offline QA manager, and system health telemetry.
            </p>
          </div>

          {/* Bottom: Feature pills */}
          <div
            className="relative z-10 grid grid-cols-3 gap-3 pt-6 mt-8"
            style={{ borderTop: "1px solid rgba(78, 205, 196, 0.15)" }}
          >
            {[
              { label: "CHW", sub: "Registry" },
              { label: "Risk", sub: "Triage" },
              { label: "Audit", sub: "Ledger" },
            ].map(({ label, sub }) => (
              <div key={label} className="pl-3" style={{ borderLeft: "2px solid #4ecdc4" }}>
                <p
                  className="font-bold text-sm"
                  style={{ color: "#e8f5f5", fontFamily: "var(--font-work-sans)" }}
                >
                  {label}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(195, 220, 220, 0.6)" }}
                >
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Right Form Panel ─── */}
        <section
          className="flex flex-col justify-center p-8"
          style={{ background: "#111c1c" }}
        >
          <h2
            className="font-bold"
            style={{
              color: "#e8f5f5",
              fontSize: "1.35rem",
              fontFamily: "var(--font-hind-siliguri)",
            }}
          >
            Sign In
          </h2>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{
              color: "rgba(195, 220, 220, 0.6)",
              fontFamily: "var(--font-hind-siliguri)",
            }}
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
