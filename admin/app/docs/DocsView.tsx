"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { Mermaid } from "@/components/Mermaid";

/* ─── TYPES ───────────────────────────────────────────────── */

export type TeamMember = {
  name: string;
  role: string;
  email: string;
  initials: string;
  avatar_url?: string;
};

export type FeatureRow = {
  feature: string;
  status: "Live" | "Planned";
  notes: string;
};

type DocsViewProps = {
  youtubeUrl: string;
  teamMembers: TeamMember[];
  features: FeatureRow[];
  backendHealthUrl: string;
};

/* ─── CONSTANTS ───────────────────────────────────────────── */

const architectureDiagram = `flowchart LR
  Client["Client: SQLite + WAL, ONNX, Sync Worker"] --> FastAPI["FastAPI: sync, chat, health"]
  FastAPI --> Supabase["Supabase: Postgres, pgvector, RLS, Edge Fn"]
  Supabase --> AI["AI Layer: Groq -> Gemini -> Offline"]`;

const dataFlowDiagram = `flowchart LR
  CHW["CHW input"] --> SQLite["SQLite write"]
  SQLite --> ONNX["ONNX inference"]
  ONNX --> Badge["Risk badge"]
  Badge --> Outbox["Outbox"]
  Outbox --> Sync["Sync"]
  Sync --> Supabase["Supabase"]
  Supabase --> Dashboard["Admin dashboard"]`;

type NavItem = { id: string; title: string; icon: string; group: "pitch" | "technical" };

const navItems: NavItem[] = [
  { id: "problem", title: "Problem", icon: "🩺", group: "pitch" },
  { id: "solution", title: "Solution", icon: "💡", group: "pitch" },
  { id: "market", title: "Market & Model", icon: "📊", group: "pitch" },
  { id: "traction", title: "Traction", icon: "🚀", group: "pitch" },
  { id: "team", title: "Team", icon: "👥", group: "pitch" },
  { id: "product-overview", title: "Product Overview", icon: "📋", group: "pitch" },
  { id: "features", title: "Feature Matrix", icon: "✨", group: "technical" },
  { id: "architecture", title: "Architecture", icon: "🏗️", group: "technical" },
  { id: "ai-layer", title: "AI Layer", icon: "🤖", group: "technical" },
  { id: "data-layer", title: "Data Layer", icon: "🗄️", group: "technical" },
  { id: "stack", title: "Tech Stack", icon: "🛠️", group: "technical" },
  { id: "api", title: "API Docs", icon: "🔌", group: "technical" },
  { id: "security", title: "Security", icon: "🔒", group: "technical" },
  { id: "performance", title: "Performance", icon: "⚡", group: "technical" },
  { id: "roadmap", title: "Roadmap", icon: "🗺️", group: "technical" },
  { id: "analytics", title: "Analytics", icon: "📈", group: "technical" },
  { id: "changelog", title: "Changelog", icon: "📝", group: "technical" },
];

/* ─── HELPERS ─────────────────────────────────────────────── */

function embedYoutube(url: string) {
  if (!url) return "https://www.youtube.com/embed/demo";
  if (url.includes("/embed/")) return url;
  const id = new URLSearchParams(url.split("?")[1] ?? "").get("v");
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

function initialsFor(member: TeamMember) {
  return (
    member.initials ||
    member.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  );
}

/* ─── MAIN COMPONENT ──────────────────────────────────────── */

export function DocsView({ youtubeUrl, teamMembers, features, backendHealthUrl }: DocsViewProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("problem");
  const [health, setHealth] = useState<"checking" | "online" | "offline">("checking");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Health check polling
  useEffect(() => {
    let mounted = true;

    async function checkHealth() {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 5000);
        const response = await fetch(backendHealthUrl, { cache: "no-store", signal: controller.signal });
        window.clearTimeout(timeout);
        if (mounted) setHealth(response.ok ? "online" : "offline");
      } catch {
        if (mounted) setHealth("offline");
      }
    }

    checkHealth();
    const interval = window.setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [backendHealthUrl]);

  // IntersectionObserver for active section highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navItems;
    return navItems.filter((n) => n.title.toLowerCase().includes(q));
  }, [query]);

  const pitchNav = filteredNav.filter((n) => n.group === "pitch");
  const techNav = filteredNav.filter((n) => n.group === "technical");

  function registerRef(id: string) {
    return (el: HTMLElement | null) => {
      if (el) sectionRefs.current.set(id, el);
    };
  }

  return (
    <div className="docs-shell" style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-dm-sans), system-ui, sans-serif", minHeight: "100vh" }}>
      {/* ── AVAILABILITY BANNER ─────────────────────────────── */}
      <div
        className="docs-no-print"
        style={{
          background: "rgba(0,212,170,.07)",
          borderBottom: "1px solid rgba(0,212,170,.15)",
          padding: "10px 60px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: 12,
          color: "var(--text2)",
        }}
      >
        <span className="docs-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
        <span>Documentation window active · June 10 00:00 — June 14 23:59 · BuildFest 2026 Judging Period · Team DareDevil</span>
      </div>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* ── SIDEBAR ────────────────────────────────────────── */}
        <aside
          className="docs-no-print"
          style={{
            width: 240,
            minWidth: 240,
            background: "var(--bg2)",
            borderRight: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            height: "100vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          {/* Logo */}
          <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 18, fontWeight: 800, color: "var(--teal)", letterSpacing: -0.5, display: "block" }}>
              MaSheba AI
            </span>
            <span style={{ fontSize: 11, color: "var(--text3)", marginTop: 2, fontFamily: "var(--font-dm-mono), monospace", display: "block" }}>
              মা-সেবা · v1.0
            </span>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(0,212,170,.12)",
                border: "1px solid rgba(0,212,170,.25)",
                color: "var(--teal)",
                fontSize: 10,
                fontFamily: "var(--font-dm-mono), monospace",
                padding: "2px 8px",
                borderRadius: 20,
                marginTop: 8,
              }}
            >
              <span className="docs-pulse" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
              Live Docs
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: "0 10px", marginBottom: 8 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sections..."
              style={{
                width: "100%",
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "var(--bg3)",
                padding: "7px 10px",
                fontSize: 12,
                color: "var(--text)",
                outline: "none",
                fontFamily: "var(--font-dm-sans), sans-serif",
              }}
            />
          </div>

          {/* Nav links */}
          <nav style={{ padding: "0 10px", flex: 1, overflowY: "auto" }}>
            {pitchNav.length > 0 && <NavGroup label="Pitch Deck" items={pitchNav} active={active} setActive={setActive} />}
            {techNav.length > 0 && <NavGroup label="Technical" items={techNav} active={active} setActive={setActive} />}
            <span style={{ fontSize: 10, fontFamily: "var(--font-dm-mono), monospace", color: "var(--text3)", letterSpacing: ".1em", textTransform: "uppercase" as const, padding: "14px 10px 6px", display: "block" }}>
              Links
            </span>
            <a href="https://github.com/DigontaDas/MaSheba--AI" target="_blank" rel="noopener noreferrer" style={navLinkStyle(false)}>
              <span style={{ fontSize: 14, width: 16, textAlign: "center" as const }}>⌨️</span>GitHub
            </a>
          </nav>
        </aside>

        {/* ── MAIN CONTENT ──────────────────────────────────── */}
        <main style={{ flex: 1, overflow: "hidden" }}>

          {/* ── HERO ──────────────────────────────────────────── */}
          <section
            style={{
              background: "linear-gradient(135deg, var(--bg2) 0%, #071520 50%, #041010 100%)",
              borderBottom: "1px solid var(--border)",
              padding: "72px 60px 60px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Glow effects */}
            <div style={{ position: "absolute", top: "-40%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,170,.06) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-20%", left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,.04) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, color: "var(--teal)", letterSpacing: ".1em", textTransform: "uppercase" as const, marginBottom: 20, flexWrap: "wrap" as const }}>
                <EyebrowTag>BuildFest 2026</EyebrowTag>
                <EyebrowTag>Team DareDevil</EyebrowTag>
                <EyebrowTag>Preliminary Submission</EyebrowTag>
              </div>

              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2, marginBottom: 8 }}>
                <span style={{ color: "var(--teal)" }}>MaSheba</span> AI
              </h1>
              <div style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 18, color: "var(--text2)", fontWeight: 300, letterSpacing: 1, marginBottom: 24 }}>
                মা-সেবা — Every Mother Deserves a Safety Net
              </div>
              <p style={{ fontSize: 18, color: "var(--text2)", maxWidth: 640, lineHeight: 1.7, borderLeft: "3px solid var(--teal)", paddingLeft: 20, margin: "20px 0 32px", fontStyle: "italic", fontWeight: 300 }}>
                An AI-powered maternal health app that runs risk assessments in &lt;200ms with zero internet, syncs when connected, and never leaves a mother without a safety net — even during a power cut.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 32 }}>
                <Tag color="teal">Offline-First</Tag>
                <Tag color="green">On-Device ML</Tag>
                <Tag color="blue">Bangla AI Chat</Tag>
                <Tag color="amber">Rural Bangladesh</Tag>
                <Tag>React Native · Expo 55</Tag>
                <Tag>FastAPI · Supabase</Tag>
                <Tag>ONNX · XGBoost</Tag>
                <Tag>Groq · Gemini</Tag>
              </div>

              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" as const, paddingTop: 28, borderTop: "1px solid var(--border)" }}>
                <Stat value="<200ms" label="on-device risk scoring" />
                <Stat value="3MB" label="ONNX model size" />
                <Stat value="100%" label="works offline" />
                <Stat value="6-stage" label="AI safety filter" />
                <Stat value="3M+" label="target users (BD)" />
              </div>

              {/* Health badge + actions */}
              <div className="docs-no-print" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 28, flexWrap: "wrap" as const }}>
                <HealthBadge health={health} />
                <button
                  onClick={() => window.print()}
                  style={{ borderRadius: 8, border: "1px solid var(--border2)", background: "var(--bg3)", padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer" }}
                >
                  📄 Export PDF
                </button>
                <a
                  href="/docs/admin"
                  style={{ borderRadius: 8, background: "var(--teal)", padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#000", textDecoration: "none" }}
                >
                  ⚙️ Admin Panel
                </a>
              </div>
            </div>
          </section>

          {/* ── SECTIONS ──────────────────────────────────────── */}
          <div style={{ padding: "0 60px 80px" }}>

            {/* Problem */}
            <Section sectionRef={registerRef("problem")} id="problem" num="01" label="The Problem" title="A Preventable Crisis in Rural Bangladesh" sub="Bangladesh has one of the highest maternal mortality rates in South Asia. In rural areas, the situation is critical — and the root cause is not medicine, it's infrastructure.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <ProblemRow icon="🌐" title="No Reliable Network" text="Grameenphone 3G drops every 10–15 minutes; hours without any signal in remote unions" />
                <ProblemRow icon="📱" title="Low-End Devices" text="৳6,000–12,000 Android phones (2GB RAM, 16GB storage) are the norm — not the exception" />
                <ProblemRow icon="⚡" title="Load Shedding" text="Power cuts keep batteries chronically at ~30%. Apps with heavy cloud dependency fail here" />
                <ProblemRow icon="📝" title="Literacy Barriers" text="Semi-literate CHWs find typing difficult. Voice in Bangla is the natural interaction model" />
                <ProblemRow icon="🏃" title="15–20 Visits Daily" text="CHWs walk between patients on foot. Multi-step forms and loading screens cost lives in an emergency" />
                <ProblemRow icon="🚨" title="Zero Clinical Decision Support" text="No tool exists that works offline on cheap Android, speaks Bangla, and escalates pre-eclampsia, anemia, or hemorrhage automatically" />
              </div>
            </Section>

            {/* Solution */}
            <Section sectionRef={registerRef("solution")} id="solution" num="02" label="The Solution" title="Three Layers. One Safety Net." sub="MaSheba works even when the network doesn't. Every core feature has a fallback path — down to fully deterministic, offline rules.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
                <PitchCard num="01" title="On-Device Intelligence" highlight>
                  A 2–5MB ONNX-quantized XGBoost model scores maternal risk in under 200ms — entirely on-device. No server call. No API. No loading screen. Deterministic WHO safety rules (BP ≥ 140/90 → always HIGH) override the model whenever clinical thresholds are breached. Safety always wins.
                </PitchCard>
                <PitchCard num="02" title="Outbox-First Sync">
                  Every visit is written atomically to SQLite with WAL mode — crash-safe even during power cuts. A background worker flushes the outbox to Supabase every 2 minutes when online, using idempotency keys to prevent duplicates. Data is never lost. Ever.
                </PitchCard>
                <PitchCard num="03" title="Cascading AI Chat">
                  Bangla clinical Q&A via Groq (Llama 3.1 8B) → Gemini Flash fallback → offline Q&A library. Every response passes a 6-stage safety filter: Bangla-only, emergency keyword detection, hallucination rejection, and always-appended DGHS disclaimer. No drug dosages or diagnoses, ever.
                </PitchCard>
                <PitchCard num="04" title="Dual User Modes">
                  Community Health Workers get a full clinical workflow: visit recording, instant risk badge, AI chat, medicine verification, nutrition guidance. Mothers get a personal pregnancy dashboard with Bangla Q&A and milestone tracking — all accessible offline.
                </PitchCard>
              </div>

              {/* Product Demo */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📹 Product Demo</h3>
                <div style={{ aspectRatio: "16/9", overflow: "hidden", borderRadius: 8, border: "1px solid var(--border)", background: "#000" }}>
                  <iframe
                    style={{ width: "100%", height: "100%", border: "none" }}
                    src={embedYoutube(youtubeUrl)}
                    title="MaSheba AI product demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </Section>

            {/* Market */}
            <Section sectionRef={registerRef("market")} id="market" num="03" label="Market & Business Model" title="A 3M-Patient Opportunity" sub="The addressable market is the entire maternal health infrastructure of Bangladesh — and the problem exists in every low-LMIC country worldwide.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                <Card icon="🇧🇩" title="3M+ Pregnant Women" text="Active pregnancies in rural Bangladesh at any given time — the core beneficiary population." />
                <Card icon="👩‍⚕️" title="60,000+ CHWs" text="Community Health Workers deployed by DGHS and NGOs nationwide. Primary distribution channel." />
                <Card icon="🌍" title="Global Expansion" text="Same constraints exist in rural India, Sub-Saharan Africa, Myanmar. The architecture is geography-agnostic." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card title="Revenue Model" text="Phase 1: Free deployment, impact-driven. Phase 2: Government MoH licensing — SaaS per-upazila subscription. Phase 3: DGHS national integration. Phase 4: Licensing to international NGOs (UNFPA, WHO programs)." />
                <Card title="Competitive Advantage" text="No existing tool combines: (1) fully offline AI risk scoring, (2) Bangla-native voice/chat, (3) deterministic safety rule overrides, (4) cascading LLM fallback, and (5) sub-$0 monthly operating cost per CHW at scale." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <Card title="Go-To-Market" text="Pilot one upazila → train 50 CHWs → prove compliance and referral impact → expand district by district." />
                <Card title="Vision" text="5,000+ CHWs, national DGHS integration, and on-device fine-tuned Llama 3.1 for resilient maternal care across Bangladesh." />
              </div>
            </Section>

            {/* Traction */}
            <Section sectionRef={registerRef("traction")} id="traction" num="04" label="Traction" title="Already Deployed. Not Just Designed." sub="As of the preliminary submission, MaSheba is a working system — not a mockup or prototype.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <TractionCard title="Backend Live" text="FastAPI deployed on Railway. GET /health, POST /sync, POST /chat all operational. Supabase Cloud schema deployed with RLS, edge functions, and pgvector." />
                <TractionCard title="Mobile App Running" text="React Native (Expo 55) building on Android 8+. ONNX model integrated and benchmarked. Outbox sync tested end-to-end." />
                <TractionCard title="Stress Tests Passing" text="50-event sync → 50 SYNCED. Repeat → 50 DUPLICATE (idempotency confirmed). RLS verified: CHW A cannot read CHW B's patients." />
                <TractionCard title="ML Pipeline Complete" text="XGBoost trained on Kaggle maternal health datasets, exported to ONNX, validated against WHO clinical thresholds, benchmarked on target hardware." />
                <TractionCard title="Admin Dashboard Live" text="Next.js 14 deployed on Vercel. Risk summary charts, CHW list, upazila-level aggregation — all served via SSR from Supabase." />
                <TractionCard title="Figma Design Approved" text="Full mobile UI design complete. High-contrast accessibility-first layouts optimised for 360px screens on cheap Android devices." />
              </div>
            </Section>

            {/* Team */}
            <Section sectionRef={registerRef("team")} id="team" num="05" label="Team" title="Team DareDevil" sub="A multidisciplinary BuildFest team covering product, design, engineering, data science, and communications.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
                {teamMembers.map((member) => (
                  <TeamCard key={`${member.name}-${member.role}`} member={member} />
                ))}
              </div>
            </Section>

            {/* Product Overview */}
            <Section sectionRef={registerRef("product-overview")} id="product-overview" num="06" label="Product Overview" title="What MaSheba Does" sub="An end-to-end maternal health workflow for community health workers, mothers, and health administrators.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card icon="📱" title="What It Does" text="Screens pregnancy risk offline, supports Bangla clinical Q&A, verifies medicine guidance, syncs care data, and gives admins operational visibility." />
                <Card icon="👩‍⚕️" title="CHW Journey" text="Register mother → enter vitals → receive ONNX risk badge → ask Bangla questions → queue records → sync when mobile data returns." />
                <Card icon="🤰" title="Mother Journey" text="Receive local visit → understand risk flags in simple language → get reminders → escalate to care when danger signs appear." />
                <Card icon="📊" title="Admin Journey" text="Monitor CHWs → risk distribution → visit trends → sync health → compliance rate → release settings from the dashboard." />
              </div>
            </Section>

            {/* Feature Matrix */}
            <Section sectionRef={registerRef("features")} id="features" num="07" label="Feature Matrix" title="What's Live. What's Coming." sub="Every live feature has been integrated and tested on actual target hardware.">
              <FeatureTable rows={features} />
            </Section>

            {/* Architecture */}
            <Section sectionRef={registerRef("architecture")} id="architecture" num="08" label="Architecture" title="Three Independent Layers." sub="Each layer is independently deployable and fails gracefully without the others. The mobile app works fully offline. The backend enhances it. The AI layer enriches it.">
              <ArchitectureDiagram />
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--text2)" }}>Mermaid View</h3>
                <Mermaid chart={architectureDiagram} />
              </div>
            </Section>

            {/* AI Layer */}
            <Section sectionRef={registerRef("ai-layer")} id="ai-layer" num="09" label="AI Layer" title="On-Device Intelligence + Cascading LLM" sub="ONNX XGBoost runs on-device in 2–5MB and under 200ms. Safety rules always override. LLM cascade provides guarded Bangla clinical Q&A.">
              <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>LLM Cascade</h3>
              <CascadeFlow />

              <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 16 }}>6-Stage Safety Filter</h3>
              <SafetyFilterGrid />

              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--text2)" }}>Data Flow Diagram</h3>
                <Mermaid chart={dataFlowDiagram} />
              </div>
            </Section>

            {/* Data Layer */}
            <Section sectionRef={registerRef("data-layer")} id="data-layer" num="10" label="Data Layer" title="Datasets, Schema & Embeddings" sub="Kaggle maternal health datasets, WHO/DGHS PDFs, Supabase Postgres schema, and pgvector embeddings.">
              <DataFlowSteps />
            </Section>

            {/* Tech Stack */}
            <Section sectionRef={registerRef("stack")} id="stack" num="11" label="Tech Stack" title="Production-Grade Open Source" sub="Every layer chosen for offline resilience, low cost, and rural deployment constraints.">
              <StackGrid />
            </Section>

            {/* API Docs */}
            <Section sectionRef={registerRef("api")} id="api" num="12" label="API Documentation" title="Three Endpoints. That's It." sub="Auth model: Supabase JWT. RLS enforces chw_id = auth.uid().">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <ApiEndpoint method="GET" path="/health" description="Liveness check. No auth required. Returns { status: 'ok' }." />
                <ApiEndpoint
                  method="POST"
                  path="/sync"
                  description="Accepts 1–100 outbox events with Bearer JWT. Returns SYNCED, DUPLICATE, or FAILED per event with idempotency-key based deduplication."
                  params={[
                    { name: "events", type: "OutboxEvent[]", desc: "Array of visit events with idempotency keys" },
                    { name: "Authorization", type: "Bearer JWT", desc: "Supabase auth token from expo-secure-store" },
                  ]}
                />
                <ApiEndpoint
                  method="POST"
                  path="/chat"
                  description="Bangla clinical Q&A. Returns answer text, is_emergency boolean, and source (groq | gemini | offline). All responses pass the 6-stage safety filter."
                  params={[
                    { name: "question", type: "string", desc: "User question in Bangla or English" },
                    { name: "trimester", type: "number", desc: "Current trimester for context (1, 2, or 3)" },
                  ]}
                />
              </div>
            </Section>

            {/* Security */}
            <Section sectionRef={registerRef("security")} id="security" num="13" label="Security" title="Defense in Depth" sub="Every layer has independent security controls. No single point of compromise exposes patient data.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <SecurityCard icon="🔐" title="Authentication" items={["Supabase JWT per CHW", "expo-secure-store for token storage", "Service role key never exposed to client", "Admin role verified server-side"]} />
                <SecurityCard icon="🛡️" title="Data Isolation" items={["RLS: chw_id = auth.uid() on all tables", "CHW A cannot read CHW B's patients", "Admin service role bypasses RLS server-only", "No PII in application logs"]} />
                <SecurityCard icon="🤖" title="AI Safety" items={["6-stage LLM safety filter", "Bangla-only response enforcement", "Emergency keyword → auto-referral", "Never outputs drug dosages or diagnoses", "DGHS disclaimer always appended"]} />
              </div>
            </Section>

            {/* Performance */}
            <Section sectionRef={registerRef("performance")} id="performance" num="14" label="Performance & Scalability" title="Built for the Worst Case" sub="Every metric is measured on the actual target: Android 8, 2GB RAM, intermittent 3G.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                <PerfCard value="<200ms" label="ONNX inference on Android 8" />
                <PerfCard value="~50MB" label="SQLite storage budget" />
                <PerfCard value="~200" label="CHWs on Supabase free tier" />
                <PerfCard value="2 min" label="Background sync interval" />
              </div>
              <Card title="Scale Path" text="Current Supabase free tier supports ~200 CHWs. Scale path: dedicated Supabase droplet → load balancer → read replicas → multi-region. Mobile storage budget of ~50MB handles 6+ months of local visit data." />
            </Section>

            {/* Roadmap */}
            <Section sectionRef={registerRef("roadmap")} id="roadmap" num="15" label="Roadmap" title="What's Next" sub="Each release is scoped to a single quarter with clear deliverables.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                <RoadmapCard phase="v0.2" color="var(--teal)" title="RAG + Voice" items={["Full RAG pipeline (pgvector WHO/DGHS chunks)", "Whisper Tiny ONNX offline voice input", "Bangla speech-to-text for hands-free intake"]} />
                <RoadmapCard phase="v0.3" color="var(--blue)" title="Audio + Maps" items={["Coqui TTS Bangla offline text-to-speech", "Geographic risk heat maps (union-level)", "SMS appointment reminders"]} />
                <RoadmapCard phase="v1.0" color="var(--amber)" title="On-Device LLM" items={["LoRA fine-tuned Llama 3.1 8B", "GGUF 4-bit quantization via llama.cpp", "100% offline LLM clinical Q&A", "DGHS national HL7 FHIR integration"]} />
              </div>
            </Section>

            {/* Analytics */}
            <Section sectionRef={registerRef("analytics")} id="analytics" num="16" label="Analytics" title="Operational Visibility" sub="Admin analytics serve health officers with real-time views into CHW performance and risk distribution.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <Card title="v_risk_summary" text="Aggregated risk distribution per upazila. HIGH / MEDIUM / LOW counts with trend indicators." />
                <Card title="v_chw_list" text="Active CHW list with last sync timestamp, total visits, and compliance percentage." />
                <Card title="Operational Metrics" text="CHW compliance rate, visit trend over time, risk distribution per geographic area, sync failure rate." />
              </div>
            </Section>

            {/* Changelog */}
            <Section sectionRef={registerRef("changelog")} id="changelog" num="17" label="Changelog" title="Release History">
              <ChangelogEntry
                version="v1.0.0"
                date="May 27, 2026"
                title="Initial BuildFest Submission"
                items={[
                  "Offline risk assessment with ONNX XGBoost model",
                  "Outbox-first sync with SQLite WAL and idempotency keys",
                  "Bangla AI clinical chat (Groq → Gemini → offline cascade)",
                  "Offline Q&A library with trimester-tagged answers",
                  "Medicine verification workflow",
                  "FCM push notifications for HIGH-risk events",
                  "Admin dashboard with Recharts analytics",
                  "Supabase RLS policies enforcing CHW isolation",
                  "50-event stress test passing with 100% idempotency",
                ]}
              />
            </Section>
          </div>

          {/* ── FOOTER ────────────────────────────────────────── */}
          <footer
            style={{
              padding: "32px 60px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap" as const,
              gap: 16,
              fontSize: 13,
              color: "var(--text3)",
            }}
          >
            <div>
              Built by <strong style={{ color: "var(--teal)" }}>Team DareDevil</strong> · BuildFest 2026
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <a href="https://github.com/DigontaDas/MaSheba--AI" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text3)", textDecoration: "none" }}>
                GitHub
              </a>
              <a href="/docs/admin" style={{ color: "var(--text3)", textDecoration: "none" }}>
                Admin
              </a>
            </div>
          </footer>
        </main>
      </div>

      {/* ── RESPONSIVE OVERRIDES ────────────────────────────── */}
      <style jsx global>{`
        @media (max-width: 1100px) {
          .docs-shell > div > aside { display: none !important; }
          .docs-shell section[style] { padding-left: 28px !important; padding-right: 28px !important; }
          .docs-shell footer { padding-left: 28px !important; padding-right: 28px !important; }
          .docs-shell .docs-avail { padding-left: 28px !important; padding-right: 28px !important; }
        }
        @media (max-width: 900px) {
          .docs-grid-5 { grid-template-columns: repeat(3, 1fr) !important; }
          .docs-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .docs-grid-3 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 700px) {
          .docs-shell .docs-hero { padding: 40px 20px !important; }
          .docs-shell .docs-hero h1 { font-size: 32px !important; }
          .docs-grid-5, .docs-grid-4, .docs-grid-3, .docs-grid-2 { grid-template-columns: 1fr !important; }
          .docs-cascade { flex-direction: column !important; }
          .docs-cascade-arrow { transform: rotate(90deg); }
          .docs-content-pad { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── SUB-COMPONENTS ──────────────────────────────────────── */

function navLinkStyle(isActive: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    borderRadius: 7,
    fontSize: 13,
    color: isActive ? "var(--teal)" : "var(--text2)",
    background: isActive ? "rgba(0,212,170,.1)" : "transparent",
    cursor: "pointer",
    transition: "all .15s",
    textDecoration: "none",
    marginBottom: 2,
  };
}

function NavGroup({ label, items, active, setActive }: { label: string; items: NavItem[]; active: string; setActive: (id: string) => void }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <span style={{ fontSize: 10, fontFamily: "var(--font-dm-mono), monospace", color: "var(--text3)", letterSpacing: ".1em", textTransform: "uppercase" as const, padding: "14px 10px 6px", display: "block" }}>
        {label}
      </span>
      {items.map((item) => (
        <a key={item.id} href={`#${item.id}`} onClick={() => setActive(item.id)} style={navLinkStyle(active === item.id)}>
          <span style={{ fontSize: 14, width: 16, textAlign: "center" as const }}>{item.icon}</span>
          {item.title}
        </a>
      ))}
    </div>
  );
}

function EyebrowTag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "rgba(0,212,170,.12)", border: "1px solid rgba(0,212,170,.2)", padding: "3px 10px", borderRadius: 20 }}>
      {children}
    </span>
  );
}

type TagColor = "teal" | "green" | "blue" | "amber";
const tagColors: Record<TagColor, { bg: string; border: string; text: string }> = {
  teal: { bg: "rgba(0,212,170,.1)", border: "rgba(0,212,170,.25)", text: "var(--teal)" },
  green: { bg: "rgba(34,197,94,.1)", border: "rgba(34,197,94,.25)", text: "var(--green)" },
  blue: { bg: "rgba(56,189,248,.1)", border: "rgba(56,189,248,.25)", text: "var(--blue)" },
  amber: { bg: "rgba(245,158,11,.1)", border: "rgba(245,158,11,.25)", text: "var(--amber)" },
};

function Tag({ color, children }: { color?: TagColor; children: React.ReactNode }) {
  const c = color ? tagColors[color] : { bg: "var(--bg3)", border: "var(--border2)", text: "var(--text2)" };
  return (
    <span style={{ fontSize: 11, fontFamily: "var(--font-dm-mono), monospace", padding: "4px 12px", borderRadius: 20, background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {children}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 28, fontWeight: 700, color: "var(--teal)", letterSpacing: -1 }}>{value}</span>
      <span style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{label}</span>
    </div>
  );
}

function HealthBadge({ health }: { health: "checking" | "online" | "offline" }) {
  const colors = {
    online: { border: "rgba(0,212,170,.3)", bg: "rgba(0,212,170,.1)", text: "var(--teal)", dot: "var(--green)" },
    offline: { border: "rgba(239,68,68,.3)", bg: "rgba(239,68,68,.1)", text: "var(--red)", dot: "var(--red)" },
    checking: { border: "var(--border)", bg: "var(--bg3)", text: "var(--text3)", dot: "var(--text3)" },
  };
  const c = colors[health];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, border: `1px solid ${c.border}`, background: c.bg, padding: "5px 12px", fontSize: 12, fontFamily: "var(--font-dm-mono), monospace", color: c.text }}>
      <span className={health !== "checking" ? "docs-pulse" : ""} style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
      Backend: {health}
    </span>
  );
}

/* ─── Section wrapper ─────────────────────────────────────── */
type SectionProps = {
  id: string;
  num: string;
  label: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
  sectionRef?: (el: HTMLElement | null) => void;
};

const Section = ({ id, num, label, title, sub, children, sectionRef }: SectionProps) => (
  <section
    ref={sectionRef}
    id={id}
    className="docs-fade-in docs-content-pad"
    style={{ paddingTop: 64, borderTop: "1px solid var(--border)", scrollMarginTop: 20 }}
  >
    <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, color: "var(--teal)", letterSpacing: ".12em", textTransform: "uppercase" as const, marginBottom: 10 }}>
      {num} · {label}
    </div>
    <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 30, fontWeight: 700, letterSpacing: -0.5, marginBottom: 8 }}>{title}</h2>
    {sub && <p style={{ fontSize: 15, color: "var(--text2)", marginBottom: 32, maxWidth: 680, fontWeight: 300 }}>{sub}</p>}
    {children}
  </section>
);

/* ─── Problem Row ─────────────────────────────────────────── */
function ProblemRow({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="docs-grid-2" style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div>
        <strong style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 14, fontWeight: 600, display: "block", marginBottom: 4 }}>{title}</strong>
        <span style={{ fontSize: 13, color: "var(--text2)" }}>{text}</span>
      </div>
    </div>
  );
}

/* ─── Pitch Card ──────────────────────────────────────────── */
function PitchCard({ num, title, highlight, children }: { num: string; title: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: highlight ? "linear-gradient(135deg, var(--card), rgba(0,212,170,.04))" : "var(--card)",
        border: `1px solid ${highlight ? "rgba(0,212,170,.3)" : "var(--border)"}`,
        borderRadius: 12,
        padding: 28,
        transition: "border-color .2s",
      }}
    >
      <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 36, fontWeight: 800, color: highlight ? "rgba(0,212,170,.3)" : "var(--border2)", letterSpacing: -2, marginBottom: 12, lineHeight: 1 }}>{num}</div>
      <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.65 }}>{children}</p>
    </div>
  );
}

/* ─── Card ────────────────────────────────────────────────── */
function Card({ icon, title, text }: { icon?: string; title: string; text: string }) {
  return (
    <div className="docs-card" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
      {icon && (
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(0,212,170,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 14 }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

/* ─── Traction Card ───────────────────────────────────────── */
function TractionCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="docs-card" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(34,197,94,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 14 }}>
        ✅
      </div>
      <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

/* ─── Team Card ───────────────────────────────────────────── */
function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div
      className="docs-grid-5"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "20px 16px",
        textAlign: "center",
        transition: "border-color .2s, transform .2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,170,.35)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {member.avatar_url ? (
        <img src={member.avatar_url} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", margin: "0 auto 14px", border: "2px solid var(--border2)" }} />
      ) : (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--border2), var(--teal2))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "var(--bg)",
            margin: "0 auto 14px",
            border: "2px solid var(--border2)",
          }}
        >
          {initialsFor(member)}
        </div>
      )}
      <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{member.name}</div>
      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10, lineHeight: 1.4 }}>{member.role}</div>
      <a href={`mailto:${member.email}`} style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 10, color: "var(--teal)", opacity: 0.8, wordBreak: "break-all", textDecoration: "none" }}>
        {member.email}
      </a>
    </div>
  );
}

/* ─── Feature Table ───────────────────────────────────────── */
function FeatureTable({ rows }: { rows: FeatureRow[] }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
        <thead>
          <tr>
            {["Feature", "Status", "Notes"].map((h) => (
              <th key={h} style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, letterSpacing: ".07em", textTransform: "uppercase" as const, color: "var(--text3)", padding: "12px 16px", borderBottom: "1px solid var(--border)", textAlign: "left" as const, fontWeight: 500 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.feature}-${i}`} style={{ transition: "background .15s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,.02)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <td style={{ padding: "13px 16px", borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}>{row.feature}</td>
              <td style={{ padding: "13px 16px", borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}>
                <StatusBadge status={row.status} />
              </td>
              <td style={{ padding: "13px 16px", borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none", color: "var(--text2)" }}>{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isLive = status === "Live";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontFamily: "var(--font-dm-mono), monospace",
        padding: "3px 9px",
        borderRadius: 20,
        whiteSpace: "nowrap",
        background: isLive ? "rgba(34,197,94,.12)" : "rgba(56,189,248,.1)",
        color: isLive ? "var(--green)" : "var(--blue)",
        border: `1px solid ${isLive ? "rgba(34,197,94,.25)" : "rgba(56,189,248,.2)"}`,
      }}
    >
      {isLive && <span className="docs-pulse" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />}
      {status}
    </span>
  );
}

/* ─── Architecture Diagram (Custom) ───────────────────────── */
function ArchitectureDiagram() {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <ArchLayer dotColor="var(--teal)" label="Client Layer" sub="React Native (Expo 55) · Android 8+">
        <ArchNode title="SQLite + WAL" sub="Local DB + outbox table" />
        <ArchNode title="ONNX Risk Model" sub="XGBoost · 8 vitals · <200ms" />
        <ArchNode title="Safety Rules" sub="mergeWithSafety() override" />
        <ArchNode title="Sync Worker" sub="expo-background-task · 2 min" />
        <ArchNode title="Offline Q&A" sub="SQLite seed · trimester tagged" />
        <ArchNode title="expo-secure-store" sub="JWT in device keychain" />
      </ArchLayer>
      <ArchConnector text="outbox batch sync (HTTPS · idempotency key) · background poll every 2 minutes" />
      <ArchLayer dotColor="var(--blue)" label="Backend Layer" sub="FastAPI 0.115 (Python) + Supabase Postgres 15">
        <ArchNode title="GET /health" sub="Liveness · no auth" />
        <ArchNode title="POST /sync" sub="Outbox batch · JWT Bearer" />
        <ArchNode title="POST /chat" sub="LLM cascade · Bangla" />
        <ArchNode title="Supabase Postgres" sub="chws · patients · visits · outbox" />
        <ArchNode title="pgvector" sub="WHO/DGHS embeddings · HNSW" />
        <ArchNode title="RLS Policies" sub="chw_id = auth.uid() enforced" />
      </ArchLayer>
      <ArchConnector text="Groq API · Gemini API · edge function calls" />
      <ArchLayer dotColor="var(--amber)" label="AI Layer" sub="On-device ONNX + Cloud LLM cascade">
        <ArchNode title="ONNX XGBoost" sub="2–5MB · <200ms · 8 vitals" />
        <ArchNode title="Safety Rules" sub="WHO thresholds override ML" />
        <ArchNode title="Groq Llama 3.1 8B" sub="Primary LLM · free tier" />
        <ArchNode title="Gemini Flash" sub="Fallback LLM" />
        <ArchNode title="Offline Q&A" sub="Deterministic seed responses" />
      </ArchLayer>
    </div>
  );
}

function ArchLayer({ dotColor, label, sub, children }: { dotColor: string; label: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 24px" }}>
      <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" as const, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
        <span style={{ color: dotColor }}>{label}</span>
        <span style={{ color: "var(--text3)", fontWeight: 400 }}>{sub}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function ArchNode({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      <strong style={{ display: "block", fontFamily: "var(--font-syne), sans-serif", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{title}</strong>
      <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--font-dm-mono), monospace" }}>{sub}</span>
    </div>
  );
}

function ArchConnector({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 24px", gap: 8, fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, color: "var(--text3)" }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border), transparent)" }} />
      <span>▼ {text}</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border), transparent)" }} />
    </div>
  );
}

/* ─── Cascade Flow ────────────────────────────────────────── */
function CascadeFlow() {
  return (
    <div className="docs-cascade" style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" as const }}>
      <CascadeStep label="Step 1" name="ONNX XGBoost" note="On-device, <200ms, 8 vitals" variant="primary" />
      <CascadeArrow />
      <CascadeStep label="Override" name="Safety Rules" note="BP ≥ 140/90 → always HIGH" variant="primary" />
      <CascadeArrow />
      <CascadeStep label="Primary" name="Groq Llama 3.1 8B" note="Free tier, low latency" variant="fb1" />
      <CascadeArrow />
      <CascadeStep label="Fallback 1" name="Gemini Flash" note="Google API fallback" variant="fb2" />
      <CascadeArrow />
      <CascadeStep label="Fallback 2" name="Offline Q&A" note="Deterministic seed answers" variant="offline" />
    </div>
  );
}

function CascadeStep({ label, name, note, variant }: { label: string; name: string; note: string; variant: "primary" | "fb1" | "fb2" | "offline" }) {
  const borderColors = { primary: "rgba(0,212,170,.3)", fb1: "rgba(56,189,248,.25)", fb2: "rgba(245,158,11,.2)", offline: "rgba(239,68,68,.2)" };
  const bgColors = { primary: "rgba(0,212,170,.05)", fb1: "var(--card)", fb2: "var(--card)", offline: "rgba(239,68,68,.03)" };
  return (
    <div style={{ background: bgColors[variant], border: `1px solid ${borderColors[variant]}`, borderRadius: 10, padding: "16px 20px", flex: 1, minWidth: 140 }}>
      <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 10, color: "var(--text3)", letterSpacing: ".08em", textTransform: "uppercase" as const, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 12, color: "var(--text2)" }}>{note}</div>
    </div>
  );
}

function CascadeArrow() {
  return <span className="docs-cascade-arrow" style={{ padding: "0 8px", color: "var(--text3)", fontSize: 16, flexShrink: 0 }}>→</span>;
}

/* ─── Safety Filter Grid ──────────────────────────────────── */
function SafetyFilterGrid() {
  const steps = [
    { num: "1", title: "Language Gate", desc: "Response must be in Bangla. English or mixed responses are rejected." },
    { num: "2", title: "Emergency Keywords", desc: "Detect danger signs → auto-generate hospital referral immediately." },
    { num: "3", title: "Hallucination Check", desc: "Cross-reference against known clinical facts. Reject unverifiable claims." },
    { num: "4", title: "No Dosage Rule", desc: "Never output specific drug dosages or medication prescriptions." },
    { num: "5", title: "No Diagnosis Rule", desc: "Never output specific medical diagnoses. Always recommend professional consult." },
    { num: "6", title: "DGHS Disclaimer", desc: "Append official DGHS disclaimer to every response without exception." },
  ];
  return (
    <div className="docs-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {steps.map((s) => (
        <div key={s.num} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 20, fontWeight: 800, color: "var(--border2)", lineHeight: 1, flexShrink: 0 }}>{s.num}</span>
          <div>
            <h4 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{s.title}</h4>
            <p style={{ fontSize: 12, color: "var(--text2)", margin: 0 }}>{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Data Flow Steps ─────────────────────────────────────── */
function DataFlowSteps() {
  const steps = [
    { num: "01", title: "Sources", items: ["Kaggle: csafrit2/maternal-health-risk-data", "Kaggle: ankurray00", "WHO maternal health PDFs", "DGHS Bangladesh guidelines"] },
    { num: "02", title: "Processing", items: ["XGBoost training pipeline", "ONNX export + quantization", "WHO/DGHS PDF chunking", "text-embedding-3-small vectors"] },
    { num: "03", title: "Storage", items: ["Supabase: chws table", "Supabase: patients table", "Supabase: visits table", "Supabase: outbox_events table", "pgvector: WHO/DGHS embeddings"] },
    { num: "04", title: "Access", items: ["RLS: chw_id = auth.uid()", "Service role: admin only", "Edge functions: batch RPC", "Offline: SQLite local copy"] },
  ];
  return (
    <div className="docs-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      {steps.map((s, i) => (
        <div key={s.num} style={{ padding: "20px 18px", borderRight: i < steps.length - 1 ? "1px solid var(--border)" : "none" }}>
          <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 32, fontWeight: 800, color: "var(--border2)", lineHeight: 1, marginBottom: 10 }}>{s.num}</div>
          <h4 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.title}</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {s.items.map((item) => (
              <li key={item} style={{ fontSize: 12.5, color: "var(--text2)", padding: "3px 0", borderBottom: "1px solid var(--border)" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ─── Stack Grid ──────────────────────────────────────────── */
function StackGrid() {
  const rows = [
    { layer: "Frontend", tech: "React Native Expo 55", why: "Cross-platform mobile with offline SQLite and ONNX support" },
    { layer: "Backend", tech: "FastAPI 0.115", why: "High-performance async Python API with Pydantic validation" },
    { layer: "Database", tech: "Supabase Postgres 15 + pgvector", why: "Managed Postgres with RLS, edge functions, and vector search" },
    { layer: "AI / ML", tech: "XGBoost ONNX + Groq + Gemini", why: "On-device inference + free-tier LLM cascade for Bangla Q&A" },
    { layer: "Admin", tech: "Next.js 14 + Recharts", why: "SSR dashboard with interactive analytics charts" },
    { layer: "Infra", tech: "Vercel + Railway + Supabase Cloud", why: "Zero-ops deployment with global CDN and managed services" },
  ];
  return (
    <div className="docs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {rows.map((r) => (
        <div key={r.layer} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14 }}>
          <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 10, color: "var(--text3)", letterSpacing: ".06em", textTransform: "uppercase" as const, minWidth: 80, paddingTop: 2, flexShrink: 0 }}>
            {r.layer}
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{r.tech}</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>{r.why}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── API Endpoint ────────────────────────────────────────── */
type ApiParam = { name: string; type: string; desc: string };

function ApiEndpoint({ method, path, description, params }: { method: string; path: string; description: string; params?: ApiParam[] }) {
  const isPost = method === "POST";
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
        <span
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 12,
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: 5,
            background: isPost ? "rgba(56,189,248,.12)" : "rgba(34,197,94,.15)",
            color: isPost ? "var(--blue)" : "var(--green)",
            border: `1px solid ${isPost ? "rgba(56,189,248,.2)" : "rgba(34,197,94,.2)"}`,
          }}
        >
          {method}
        </span>
        <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 14, color: "var(--text)" }}>{path}</span>
      </div>
      <div style={{ padding: "16px 18px" }}>
        <p style={{ fontSize: 13.5, color: "var(--text2)", marginBottom: params ? 12 : 0 }}>{description}</p>
        {params && (
          <table style={{ width: "100%", fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ color: "var(--text3)", padding: "6px 0", fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, fontWeight: 500, textAlign: "left" as const }}>Param</th>
                <th style={{ color: "var(--text3)", padding: "6px 0", fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, fontWeight: 500, textAlign: "left" as const }}>Type</th>
                <th style={{ color: "var(--text3)", padding: "6px 0", fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, fontWeight: 500, textAlign: "left" as const }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {params.map((p) => (
                <tr key={p.name}>
                  <td style={{ padding: "6px 0", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-dm-mono), monospace", color: "var(--teal)", fontSize: 12 }}>{p.name}</td>
                  <td style={{ padding: "6px 0", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-dm-mono), monospace", color: "var(--amber)", fontSize: 11 }}>{p.type}</td>
                  <td style={{ padding: "6px 0", borderBottom: "1px solid var(--border)", color: "var(--text2)" }}>{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─── Security Card ───────────────────────────────────────── */
function SecurityCard({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <div className="docs-card" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 18 }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <h4 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{title}</h4>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((item) => (
          <li key={item} style={{ fontSize: 12.5, color: "var(--text2)", padding: "3px 0" }}>
            <span style={{ color: "var(--teal)" }}>· </span>{item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Performance Card ────────────────────────────────────── */
function PerfCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="docs-grid-4" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 18, textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 26, fontWeight: 800, color: "var(--teal)", letterSpacing: -1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--text3)" }}>{label}</div>
    </div>
  );
}

/* ─── Roadmap Card ────────────────────────────────────────── */
function RoadmapCard({ phase, color, title, items }: { phase: string; color: string; title: string; items: string[] }) {
  return (
    <div className="docs-card" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
      <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" as const, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
        <span style={{ color }}>{phase}</span>
      </div>
      <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{title}</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((item) => (
          <li key={item} style={{ fontSize: 13.5, color: "var(--text2)", padding: "7px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ color: "var(--text3)", flexShrink: 0, marginTop: 1 }}>→</span>{item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Changelog Entry ─────────────────────────────────────── */
function ChangelogEntry({ version, date, title, items }: { version: string; date: string; title: string; items: string[] }) {
  return (
    <div style={{ display: "flex", gap: 20, padding: "20px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ minWidth: 80 }}>
        <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 13, fontWeight: 500, color: "var(--teal)" }}>{version}</div>
        <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--font-dm-mono), monospace", marginTop: 2 }}>{date}</div>
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((item) => (
            <li key={item} style={{ fontSize: 13, color: "var(--text2)", padding: "3px 0", display: "flex", gap: 8 }}>
              <span style={{ fontSize: 10, color: "var(--teal)", flexShrink: 0, marginTop: 3 }}>✦</span>{item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
