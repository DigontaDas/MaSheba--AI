# Masheba AI — System Architecture Document

> **Version:** 1.1  
> **Last Updated:** May 29, 2026  
> **Authors:** Team DareDevil  
> **Status:** Production-ready (Hackathon Submission)

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [System Overview](#2-system-overview)
3. [Client Layer — Mobile Application](#3-client-layer--mobile-application)
4. [Backend Layer — API & Data Services](#4-backend-layer--api--data-services)
5. [AI Layer — Intelligence Pipeline](#5-ai-layer--intelligence-pipeline)
6. [Data Architecture](#6-data-architecture)
7. [Sync Architecture — Offline-First Design](#7-sync-architecture--offline-first-design)
8. [Security Architecture](#8-security-architecture)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Admin Dashboard Architecture](#10-admin-dashboard-architecture)
11. [Observability & Monitoring](#11-observability--monitoring)
12. [Scalability Considerations](#12-scalability-considerations)
13. [Failure Modes & Recovery](#13-failure-modes--recovery)
14. [Premium Design System](#14-premium-design-system)
15. [Future Architecture — On-Device LLM](#15-future-architecture--on-device-llm)

---

## 1. Design Philosophy

Masheba's architecture is built around **six non-negotiable constraints** derived from the realities of rural Bangladesh:

| Constraint | Design Response |
|------------|----------------|
| Network drops every 10-15 min on 3G | **Offline-first** — all core database features work without internet |
| ৳6,000-12,000 Android phones (2GB RAM) | **Rule-based offline safety checks** — fallback logic runs on-device |
| Load shedding keeps battery at ~30% | **WAL journaling** — survives power cuts mid-write |
| Semi-literate users | **Voice input** — Bangla speech-to-text (when online) |
| CHWs visit 15-20 patients on foot | **One-tap actions** — no multi-step forms or loading screens |
| Emergencies need instant response | **Deterministic offline safety rules** — <200ms, zero network latency |

### Architectural Principles

1. **Offline-first, online-enhanced** — The app must never be blocked by network availability for core data entry.
2. **Graceful degradation** — Every feature has a fallback path, down to fully offline deterministic safety rules.
3. **Safety over accuracy** — Deterministic safety rules always override ML predictions when they detect danger.
4. **Privacy by default** — Row Level Security (RLS) enforces data isolation at the database level.
5. **Idempotent everything** — Sync operations use idempotency keys to prevent duplicates on retry.
6. **Medical responsibility** — No drug dosages, no diagnoses, always refer to human healthcare providers.

---

## 2. System Overview

MaSheba AI features a **Dual-Portal Framework** with an integrated **Administrative Control Panel**:

- **Maternal Health Portal** — Pregnancy tracking, nutritional guidance, and urgent warning systems for mothers
- **Community Health Worker Portal** — Offline-first clinical workspace with AI triage and Groq + Gemini chat
- **Admin Dashboard Control Suite** — Real-time analytics, CHW management, and relational patient filtering

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM BOUNDARY                                │
│                                                                        │
│  ┌─────────────────────────────────────────────┐                       │
│  │          CLIENT LAYER                       │                       │
│  │    React Native (Expo) · Android 8+         │                       │
│  │                                             │                       │
│  │  ┌────────┐ ┌───────┐ ┌──────┐ ┌────────┐  │                       │
│  │  │SQLite  │ │Rule-  │ │Voice │ │ Sync   │  │                       │
│  │  │+ WAL   │ │based  │ │STT/  │ │Worker  │  │                       │
│  │  │outbox  │ │safety │ │TTS   │ │2min bg │  │                       │
│  │  └────────┘ └───────┘ └──────┘ └───┬────┘  │                       │
│  └────────────────────────────────────┬┘───────┘                       │
│                                       │                                │
│                          outbox sync (HTTPS batch)                     │
│                                       │                                │
│  ┌────────────────────────────────────▼────────────────────────┐       │
│  │          BACKEND LAYER                                     │       │
│  │    FastAPI (Python 3.11+) + Supabase (Postgres 15)         │       │
│  │                                                            │       │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌────────────┐  │       │
│  │  │API       │ │AI          │ │Notif     │ │Analytics   │  │       │
│  │  │Gateway   │ │Orchestrator│ │Service   │ │Service     │  │       │
│  │  │auth+rate │ │LangChain   │ │FCM/SMS   │ │compliance  │  │       │
│  │  └──────────┘ └─────┬──────┘ └──────────┘ └────────────┘  │       │
│  │                     │                                      │       │
│  │  ┌──────────────────▼──────────────────────────────────┐   │       │
│  │  │  Supabase Postgres                                  │   │       │
│  │  │  patients · visits · outbox_events · chws           │   │       │
│  │  │  pgvector embeddings · RLS per CHW                  │   │       │
│  │  └──────────────────┬──────────────────────────────────┘   │       │
│  └─────────────────────┼──────────────────────────────────────┘       │
│                        │                                              │
│                   RAG query + LLM cascade                             │
│                        │                                              │
│  ┌─────────────────────▼──────────────────────────────────────┐       │
│  │          AI LAYER                                         │       │
│  │                                                           │       │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────────────┐ │       │
│  │  │RAG       │ │Safety    │ │LLM Cascade                 │ │       │
│  │  │Retrieval │ │Filter    │ │Groq → Gemini → Rules       │ │       │
│  │  │pgvector  │ │medical   │ │                            │ │       │
│  │  │WHO/DGHS  │ │guardrail │ │Future: On-device Llama 3.1 │ │       │
│  │  └──────────┘ └──────────┘ └────────────────────────────┘ │       │
│  └───────────────────────────────────────────────────────────┘       │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────┐       │
│  │  ADMIN LAYER — Next.js 14 (Vercel)                       │       │
│  │  Dashboard · CHW list · Risk summary chart · Heat maps    │       │
│  │  Invisible Credentials Gateway · Relational Filtering     │       │
│  │  Docs Portal · Mermaid Diagrams                           │       │
│  └───────────────────────────────────────────────────────────┘       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Client Layer — Mobile Application

### 3.1 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | React Native (Expo) | JS ecosystem alignment with backend; Expo Go for testing on cheap devices |
| Navigation | Expo Router + React Navigation | File-based routing, bottom tabs |
| Local DB | `expo-sqlite` with WAL mode | Atomic writes survive power cuts; WAL allows concurrent read/write |
| Safety Rules | Client-side logic | Deterministic offline safety rule checks in <200ms |
| Sync | `expo-background-task` | 2-minute background polling for outbox flush |
| Auth | `expo-secure-store` | JWT storage in device keychain |
| Notifications | `expo-notifications` | Push notification support |
| Animations | `react-native-reanimated` | Smooth UI transitions on low-end devices |

### 3.2 Screen Architecture

```
app/
├── (auth)/
│   └── login                         # Supabase auth login
├── (chw)/                            # CHW-scoped screens
│   ├── dashboard                     # Patient list + risk overview
│   ├── visit/[patientId]            # Record visit vitals
│   ├── chat                         # Clinical AI chat (Requires Internet)
│   ├── medicine-verify              # Drug safety checker
│   └── profile                      # CHW profile + sync status
├── (mother)/                         # Mother-facing screens
│   ├── dashboard                     # Pregnancy tracker
│   └── qa                           # Q&A chat interface (Offline predefined fallback)
└── _layout                          # Root layout with tab navigation
```

### 3.3 On-Device Database Schema (SQLite)

```sql
PRAGMA journal_mode = WAL;    -- Crash-safe writes
PRAGMA foreign_keys = ON;     -- Referential integrity

patients (
  id TEXT PRIMARY KEY,
  chw_id TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER CHECK (10-60),
  gestational_age_weeks INTEGER CHECK (1-45),
  last_risk_level TEXT CHECK ('LOW','MODERATE','HIGH'),
  created_at TEXT, updated_at TEXT
);

visits (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id),
  chw_id TEXT, bp_systolic INTEGER CHECK (60-260),
  bp_diastolic INTEGER CHECK (30-180),
  weight_kg REAL CHECK (25-200),
  hemoglobin REAL CHECK (3-20),
  swelling_present INTEGER, symptom_flags TEXT,
  risk_level TEXT, visited_at TEXT, device_id TEXT
);

outbox_events (
  idempotency_key TEXT PRIMARY KEY,
  chw_id TEXT, device_id TEXT,
  event_type TEXT CHECK ('patient_upsert','visit_create'),
  payload TEXT, status TEXT DEFAULT 'PENDING',
  error_message TEXT, created_at TEXT, synced_at TEXT
);

offline_qa (
  id TEXT PRIMARY KEY,
  trimester TEXT CHECK ('T1','T2','T3','POSTPARTUM','ALL'),
  topic TEXT, question_bn TEXT, answer_bn TEXT,
  severity TEXT, see_doctor INTEGER, emergency INTEGER
);
```

### 3.4 Client-Side Safety Rules & Offline Scoring

Due to mobile device resource constraints and the requirement for offline-first stability, advanced ML models (like the LLM cascade) run in the cloud (hosted on Render) and are queried when online. The mobile application relies on a deterministic rule-based safety path for instant offline risk assessment.

1. **Deterministic Safety Rules:** Checks for critical conditions:
   - Systolic BP ≥ 140 or Diastolic BP ≥ 90 mmHg → HIGH RISK
   - Hemoglobin < 8 g/dL → HIGH RISK (Severe Anemia)
   - Danger signs reported (blurred vision, severe headache) → HIGH RISK
   - Edema/Swelling present along with elevated BP (Systolic ≥ 130 or Diastolic ≥ 85) → HIGH RISK

2. **Moderate Risk Indicators:**
   - Borderline vitals (Systolic BP ≥ 130, Diastolic BP ≥ 85, Hemoglobin < 10)
   - Severe swelling present
   - Late gestational age (> 36 weeks)

3. **Offline Fallback Scoring:**
   - Vitals are scored instantly (<200ms) on-device without internet.
   - If `onnxruntime-react-native` fails or is not supported natively, the client gracefully falls back to deterministic rule scoring and mock risk functions, ensuring a consistent safety net.

---

## 4. Backend Layer — API & Data Services

### 4.1 FastAPI Service Architecture

```
app/
├── main.py                    # FastAPI app + router registration
├── core/
│   └── config.py              # Pydantic Settings (env vars)
├── routers/
│   ├── health.py              # GET /health — liveness + Supabase check
│   ├── sync.py                # POST /sync — outbox batch processing
│   └── chat.py                # POST /chat — AI Q&A endpoint
├── services/
│   ├── supabase_client.py     # Supabase admin + user clients
│   └── chat_service.py        # LLM cascade + safety filters
└── models/                    # Pydantic request/response schemas
```

### 4.2 API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/health` | None | Service liveness + Supabase reachability |
| `POST` | `/sync` | Bearer JWT | Process 1-100 outbox events |
| `POST` | `/chat` | None | Bangla maternal health Q&A |

### 4.3 Sync Gateway Flow

```
Mobile App                    FastAPI                    Supabase
    │                           │                          │
    │  POST /sync               │                          │
    │  {events: [...]}          │                          │
    │  Bearer: <CHW JWT>        │                          │
    │─────────────────────────►│                          │
    │                           │  Validate JWT            │
    │                           │  Check chw_id match      │
    │                           │                          │
    │                           │  RPC: process_outbox_    │
    │                           │  batch(events)           │
    │                           │─────────────────────────►│
    │                           │                          │
    │                           │  For each event:         │
    │                           │  - Check idempotency     │
    │                           │  - Upsert patient/visit  │
    │                           │  - Write outbox_events   │
    │                           │  - RLS enforcement       │
    │                           │◄─────────────────────────│
    │                           │                          │
    │  {results: [...],         │                          │
    │   synced_at: "..."}       │                          │
    │◄─────────────────────────│                          │
```

---

## 5. AI Layer — Intelligence Pipeline

### 5.1 Chat Service Architecture

The chat service implements a **cascading LLM fallback** pattern deployed on the Render web server:

```
Request ──────────────────────────────────────────────────────►
    │
    ├─► [1] Groq API (Llama 3.1 8B Instant)
    │       ├─ Timeout: 30s
    │       ├─ Max tokens: 300
    │       ├─ Temperature: 0.3
    │       └─ ✅ Success → validate → return
    │       └─ ❌ Fail → cascade
    │
    ├─► [2] Gemini API (Flash 1.5 → 2.5)
    │       ├─ Model iteration: tries 1.5 first, 2.5 on 404
    │       ├─ Thinking disabled for 2.5 (thinkingBudget: 0)
    │       └─ ✅ Success → validate → return
    │       └─ ❌ Fail → cascade
    │
    └─► [3] Offline Fallback
            "এই মুহূর্তে সংযোগ সমস্যা হচ্ছে।
             অফলাইন তথ্য ব্যবহার করুন।"
```

### 5.2 Role-Based Internet Dependencies

Connectivity dictates how the app acts for different user classes:

- **Mothers:** Designed to degrade gracefully.
  - **Online:** Mothers can chat with the live AI assistant using natural language.
  - **Offline:** Live LLM chat is replaced by a structured offline Q&A module. Mothers choose from categorized health questions, and the app retrieves pre-seeded, trusted answers from the local SQLite `offline_qa` table.
- **Social Workers (CHWs):** Internet is **mandatory** for Clinical AI chat support.
  - Since CHWs operate in city, municipal, or upazila areas where internet networks are accessible, they require a stable internet connection for the clinical AI assistant.
  - If a CHW goes offline, a banner warns: *"Clinical AI requires internet connection."* (ক্লিনিক্যাল AI-এর জন্য ইন্টারনেট সংযোগ প্রয়োজন). The input fields are disabled to prevent inaccurate guidance. However, their offline patient records and visit forms are saved locally and synced once connection is restored.

### 5.3 System Prompt (Bangla)

The system prompt enforces strict behavioral constraints on the LLMs:

- **Language:** Bangla only
- **Scope:** Pregnancy, childbirth, maternal health, newborn care only
- **Prohibited:** Drug dosages, specific diagnoses
- **Emergency protocol:** Severe symptoms → "এখনই হাসপাতালে যান" (Go to hospital now)
- **Tone:** Warm, empathetic, 2-3 sentences max

### 5.4 Safety Filter Pipeline

```
LLM Response
    │
    ├─► [1] Bangla Character Check ([\u0980-\u09FF] regex)
    │       Reject if no Bangla characters present
    │
    ├─► [2] Sentence Normalization
    │       Cap at 3 sentences for readability
    │
    ├─► [3] Hallucination Detection
    │       Reject: "আমি বুঝতে পারলাম না", "IUD", "json requested"
    │
    ├─► [4] Emergency Keyword Scan
    │       রক্তপাত, খিঁচুনি, মাথাব্যথা, ঝাপসা, নড়াচড়া বন্ধ...
    │       If detected + response lacks "হাসপাতাল" → append referral
    │
    ├─► [5] Emergency Consistency
    │       If emergency but response mentions "চা" or "কফি" → reject
    │
    └─► [6] Safety Disclaimer
            Always append: "⚠️ এটি শুধু তথ্য। গুরুতর সমস্যায়
            সবসময় স্বাস্থ্যকর্মী বা হাসপাতালে যান।"
```

### 5.5 RAG Pipeline (Future)

```
Query: "32 weeks pregnant, BP 150/100, severe headache"
    │
    ├─► Embed query (text-embedding-3-small)
    │
    ├─► pgvector similarity search
    │   └─ Top 3 chunks from WHO/DGHS guidelines
    │
    ├─► Assemble structured prompt
    │   └─ System prompt + retrieved context + query
    │
    └─► LLM generates response
        └─ Structured: risk_level, action, referral_flag
```

---

## 6. Data Architecture

### 6.1 Data Sources

| Source | Type | Purpose |
|--------|------|---------|
| `csafrit2/maternal-health-risk-data` | Kaggle | BP-centered XGBoost training data |
| `ankurray00/maternal-health-and-high-risk-pregnancy-dataset` | Kaggle | Weight, gestational age, anemia features |
| WHO Antenatal Care Guidelines | Document | RAG embedding context |
| Bangladesh DGHS Maternal Health Protocols | Document | RAG embedding context |
| Offline Q&A Seed Data | Internal | Pre-built Bangla Q&A pairs by trimester |

### 6.2 Data Flow

```
                           ┌───────────────┐
                           │  Data Sources  │
                           │  Kaggle, WHO,  │
                           │  DGHS, Offline │
                           └───────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────┐  ┌──────────┐  ┌──────────────┐
            │ XGBoost  │  │ pgvector │  │ SQLite Seed  │
            │ Training │  │ Embed    │  │ (Offline QA) │
            │ Pipeline │  │ Pipeline │  │              │
            └────┬─────┘  └────┬─────┘  └──────┬───────┘
                 │              │               │
                 ▼              ▼               ▼
            ┌──────────┐  ┌──────────┐  ┌──────────────────┐
            │  Safety  │  │ Supabase │  │ Mobile App       │
            │  Rules   │  │ Postgres │  │ offline_qa table │
            │(Offline) │  │ vectors  │  │ seeded at init   │
            └──────────┘  └──────────┘  └──────────────────┘
```

### 6.3 Storage Architecture

| Store | Engine | Contents | Scope |
|-------|--------|----------|-------|
| **Device SQLite** | expo-sqlite + WAL | patients, visits, outbox, offline_qa, sync_state | Per-device |
| **Supabase Postgres** | PostgreSQL 15 | chws, patients, visits, outbox_events, mothers, chat | Cloud (RLS-scoped) |
| **pgvector** | Supabase extension | WHO/DGHS guideline embeddings | Cloud (shared) |
| **Safety Rules** | Client-side JavaScript | Deterministic safety rule logic | Bundled in App code |

---

## 7. Sync Architecture — Offline-First Design

### 7.1 The Outbox Pattern

The outbox pattern is the **cornerstone** of Masheba's offline capability. Every write operation on the mobile device follows this sequence:

```
1. CHW records patient visit
2. Atomic SQLite transaction (WAL mode):
   a. INSERT/UPDATE patients table
   b. INSERT visits table
   c. INSERT outbox_events (status: PENDING)
3. Rule-based risk scoring runs on-device
4. Risk level written back to patients.last_risk_level
5. UI shows risk badge immediately (no network needed)
```

### 7.2 Background Sync Worker

```typescript
// Runs every 2 minutes via expo-background-task
async function runOutboxSync() {
  // 1. Check network connectivity
  if (!network.isConnected) return { skipped: true };

  // 2. Check auth session
  if (!session) return { skipped: true };

  // 3. Read PENDING outbox events (max 100)
  const pending = await getPendingOutbox(100);
  if (pending.length === 0) return { processed: 0 };

  // 4. POST to /sync endpoint
  const response = await postSync(pending, session.accessToken);

  // 5. Apply results (SYNCED/DUPLICATE/FAILED)
  await applySyncResults(response.results, response.synced_at);

  // 6. Update last_synced_at
  await setLastSyncedAt(response.synced_at);
}
```

### 7.3 Conflict Resolution Strategy

| Scenario | Resolution |
|----------|-----------|
| Same patient updated by same CHW | Last-Write-Wins (device timestamp) |
| Duplicate sync attempt | Idempotency key returns DUPLICATE — no duplicate data |
| Connection drops mid-sync | Row stays PENDING — re-sent on next poll |
| Storage pressure (<200MB free) | Purge SYNCED outbox rows + alert user |
| LLM API timeout (>5s) | Cascade to next LLM → safety rules fallback |

### 7.4 Idempotency

Every outbox event has a unique `idempotency_key` generated on the device:

```
Format: {device_id}-{event_type}-{uuid_v4}
Example: device-a-visit-001
```

The Supabase `process_outbox_batch` RPC:
- Checks if `idempotency_key` already exists in `outbox_events`
- If exists → returns `DUPLICATE` (no data written)
- If new → writes patient/visit + outbox row → returns `SYNCED`

---

## 8. Security Architecture

### 8.1 Authentication Flow

```
Mobile App                    Supabase Auth                   Postgres
    │                              │                              │
    │  Email/Password Login        │                              │
    │─────────────────────────────►│                              │
    │                              │                              │
    │  JWT (access_token)          │                              │
    │◄─────────────────────────────│                              │
    │                              │                              │
    │  Store in expo-secure-store  │                              │
    │  (device keychain)           │                              │
    │                              │                              │
    │  POST /sync                  │                              │
    │  Bearer: <JWT>               │                              │
    │─────────────────────────────►│                              │
    │                              │  JWT → current_chw_id()      │
    │                              │─────────────────────────────►│
    │                              │                              │
    │                              │  RLS enforces:               │
    │                              │  chw_id = current_chw_id()   │
    │                              │◄─────────────────────────────│
```

### 8.2 Row Level Security (RLS)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `chws` | Own row only | ✗ | Own row only | ✗ |
| `patients` | Own patients | Own patients | Own patients | ✗ |
| `visits` | Own visits | Own visits | ✗ | ✗ |
| `outbox_events` | ✗ | Own events | ✗ | ✗ |

### 8.3 Medical Safety Controls

| Control | Implementation |
|---------|---------------|
| No drug dosage recommendations | System prompt + response filter |
| No definitive diagnoses | System prompt + response filter |
| Emergency referral injection | Auto-append "Go to hospital" for critical keywords |
| Bangla-only responses | Regex validation: `[\u0980-\u09FF]` must be present |
| Response length limit | Max 3 sentences to prevent information overload |
| Safety disclaimer | Always appended to non-emergency responses |

---

## 9. Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                  PRODUCTION                          │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │ Vercel   │    │ Railway/ │    │ Supabase     │  │
│  │          │    │ Render   │    │ Cloud        │  │
│  │ Admin    │    │          │    │              │  │
│  │ Next.js  │    │ FastAPI  │    │ Postgres 15  │  │
│  │ SSR      │    │ Backend  │    │ pgvector     │  │
│  │          │    │          │    │ Edge Fns     │  │
│  │ Free     │    │ Free/$5  │    │ Auth         │  │
│  └──────────┘    └──────────┘    │ RLS          │  │
│                                  └──────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │        Mobile Clients (Expo)                 │  │
│  │  Expo Go (dev) → EAS Build → APK (prod)     │  │
│  │  Target: Android 8+ (API 26)                 │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 9.1 Environment Variables

| Variable | Service | Purpose |
|----------|---------|---------|
| `SUPABASE_URL` | Backend, Admin | Supabase project URL |
| `SUPABASE_ANON_KEY` | Backend, Mobile | Public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend, Admin (server-only) | Admin operations (bypasses RLS) |
| `GROQ_API_KEY` | Backend | Primary LLM provider |
| `GEMINI_API_KEY` | Backend | Fallback LLM provider |
| `NEXT_PUBLIC_SUPABASE_URL` | Admin | Client-side Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Admin | Client-side API key |
| `EXPO_PUBLIC_API_BASE_URL` | Mobile | Backend API endpoint |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile | Supabase endpoint |

---

## 10. Admin Dashboard Architecture

The Admin Dashboard is a Next.js 14 web application providing district health officers with full visibility over community operations.

### 10.1 Access Model — Invisible Credentials Gateway

Access is fully integrated into the standard health worker login form. By entering the secret credentials (**Username: `admin` / Password: `admin123`**), the app intercepts and redirects instantly to the Admin Dashboard. There are no visible admin buttons to clutter the user experience.

### 10.2 Dashboard Components

| Component | Purpose |
|-----------|---------|
| **Analytics Cards** | Real-time metrics: total active workers, registered mothers, critical high-risk ratios |
| **Dynamic Risk Charts** | Recharts stacked bar chart showing LOW/MODERATE/HIGH patient distribution by CHW |
| **Unified Search & Directory Grid** | Interactive tables with real-time filters for name, union, or upazila |
| **Decluttered High-Flex Tables** | Optimized column spacing with zero-line wrapping (tuned for Bengali scripts) |
| **Relational Patient Filtering** | Tap any CHW's row to view their metrics and filter the maternal registry |
| **Docs Portal** | Embedded documentation viewer with Mermaid diagram rendering |

### 10.3 Admin Application Structure

```
admin/
├── app/
│   ├── dashboard/                   # Dashboard page (SSR)
│   ├── docs/                        # Embedded documentation portal
│   │   ├── page.tsx                 #   Product handbook viewer
│   │   ├── DocsView.tsx             #   Rendered docs content
│   │   └── admin/                   #   Admin-specific docs
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Root page
│   └── globals.css
├── components/
│   ├── RiskSummaryChart.tsx          # Recharts bar chart
│   └── Mermaid.tsx                   # Mermaid diagram renderer
├── utils/                            # Supabase server client
└── package.json
```

---

## 11. Observability & Monitoring

### 11.1 Current Monitoring

| Component | Monitoring | Mechanism |
|-----------|-----------|-----------|
| Backend health | `/health` endpoint | Returns Supabase reachability status |
| Sync integrity | Outbox summary | `getOutboxSummary()` → pending/failed counts |
| Edge function | Supabase dashboard | Function logs, invocation counts |
| RLS verification | SQL tests | `rls_verify.sql` script |
| Sync stress | Automated test | `stress_sync.py` — 50 SYNCED / 50 DUPLICATE |

### 11.2 Admin Dashboard Metrics

| Metric | Source | Visualization |
|--------|--------|---------------|
| Patients by risk level | `v_risk_summary` view | Recharts stacked bar chart |
| CHW patient counts | `v_chw_list` view | Table with union/upazila info |
| CHW compliance rates | Visit frequency analysis | Dashboard card |

---

## 12. Scalability Considerations

### 12.1 Current Capacity (Hackathon)

| Dimension | Capacity |
|-----------|----------|
| Concurrent CHWs | ~200 (single Supabase project) |
| Patients per CHW | ~500 (SQLite budget ~50MB) |
| Visits per patient | ~20 (auto-pruning of SYNCED outbox rows) |
| LLM requests/min | ~60 (Groq free tier) |

### 12.2 Scale-Up Path

| Stage | Users | Changes Needed |
|-------|-------|---------------|
| Hackathon | 2-5 CHWs | Current setup |
| Pilot (1 upazila) | ~50 CHWs | Dedicated backend, monitoring |
| District (3 upazilas) | ~200 CHWs | Load balancer, read replicas |
| National | 5,000+ CHWs | Horizontal scaling, CDN, dedicated ML serving |

---

## 13. Failure Modes & Recovery

| Failure | Impact | Recovery |
|---------|--------|----------|
| **No network** | Sync paused | Outbox accumulates PENDING; auto-retries on reconnect |
| **Power cut mid-write** | Data could corrupt | WAL journal replays on next open — zero data loss |
| **No internet connection** | Live advanced chat unavailable | Offline fallback message + local Q&A library |
| **Supabase outage** | Sync blocked | Backend returns 500; mobile continues offline |
| **Device storage full** | App crash risk | Purge SYNCED outbox rows; storage pressure alert |
| **JWT expired** | Auth fails | Re-authenticate; outbox preserved for post-auth sync |

---

## 14. Premium Design System

MaaSheba AI is crafted with extreme attention to visual harmony and premium user experiences:

| Element | Implementation |
|---------|---------------|
| **Palette** | Tailored HSL color models blending soft medical pastel tints (warm peach, healing green, soft rose) with smooth, anti-glare dark cards |
| **Notch Spacing** | Safe area layouts custom-tailored to avoid status bars and notches on both iOS and Android |
| **Android Smooth Borders** | Circular status indicator dots to prevent border-line artifacts on Android's drawing canvas |
| **Typography** | Clean Outfit/Inter sans-serif pairings alongside clear, beautiful Bengali font scaling for accessibility |
| **Risk Indicators** | Pastel glowing risk indicator dots — three-tier classification using soft, high-contrast colors |

---

## 15. Future Architecture — On-Device LLM

### 15.1 Custom Model Training Path

```
Phase 1 (Month 6-12): Data Collection
├── Anonymize real CHW visit data
├── Doctor labels outcomes (risk level accuracy)
└── Target: 10,000+ labeled visits

Phase 2 (Month 12): Fine-Tuning
├── Base model: Llama 3.1 8B
├── Method: LoRA (Low-Rank Adaptation)
├── Hardware: 1× A100 GPU (~$50 on RunPod)
└── Duration: 1 weekend

Phase 3 (Month 13): Quantization & Deployment
├── Quantize to GGUF 4-bit (~4GB) via llama.cpp
├── Package as app asset
└── Replace LLM cascade with on-device inference

Result: 100% offline AI — zero external dependencies
```

### 15.2 Target On-Device Architecture

```
┌──────────────────────────────────────────────┐
│  Mobile App (Future v1.0)                    │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ SQLite   │  │ ONNX     │  │ GGUF LLM  │  │
│  │ + WAL    │  │ XGBoost  │  │ Llama 3.1 │  │
│  │ outbox   │  │ risk     │  │ 4-bit     │  │
│  │          │  │ <200ms   │  │ ~4GB      │  │
│  └──────────┘  └──────────┘  └───────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  Whisper Tiny (ONNX) — Bangla STT   │    │
│  │  Coqui TTS — Bangla text-to-speech  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ALL FEATURES WORK WITH ZERO INTERNET        │
│  Sync is optional — for cloud backup only    │
└──────────────────────────────────────────────┘
```

---

## Appendix A: Key Design Decisions Log

| Decision | Options Considered | Choice | Rationale |
|----------|-------------------|--------|-----------|
| Mobile framework | Flutter vs React Native | React Native (Expo) | Team knows JS; Expo Go for cheap Android testing |
| Local DB | AsyncStorage vs SQLite | SQLite + WAL | Structured queries, crash safety, outbox pattern |
| ML runtime | Cloud API vs On-device ONNX | Cloud API (Render) | Expo compatibility, reliability, Llama/Gemini power |
| Cloud DB | Firebase vs Supabase | Supabase | Postgres for SQL analytics + pgvector in same DB |
| Sync pattern | Firebase RTDB vs Outbox | Outbox | Idempotent, works offline, conflict-safe |
| LLM strategy | Single provider vs cascade | Cascade | Reliability; free tier alignment across providers |
| Safety approach | Post-filter vs system prompt | Both | Defense in depth — system prompt + code filters |
| Conflict resolution | CRDT vs LWW | LWW (device timestamp) | Single-owner domain; CRDTs are over-engineering |

---

> **This document is maintained by Team DareDevil and updated with each major architectural change.**
