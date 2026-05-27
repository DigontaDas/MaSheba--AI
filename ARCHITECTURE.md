# MaSheba AI — System Architecture Document

> **Version:** 1.0  
> **Last Updated:** May 27, 2026  
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
10. [Observability & Monitoring](#10-observability--monitoring)
11. [Scalability Considerations](#11-scalability-considerations)
12. [Failure Modes & Recovery](#12-failure-modes--recovery)
13. [Future Architecture — On-Device LLM](#13-future-architecture--on-device-llm)

---

## 1. Design Philosophy

MaSheba's architecture is built around **six non-negotiable constraints** derived from the realities of rural Bangladesh:

| Constraint | Design Response |
|------------|----------------|
| Network drops every 10-15 min on 3G | **Offline-first** — all core features work without internet |
| ৳6,000-12,000 Android phones (2GB RAM) | **Lightweight on-device ML** — ONNX model is 2-5MB |
| Load shedding keeps battery at ~30% | **WAL journaling** — survives power cuts mid-write |
| Semi-literate users | **Voice input** — Bangla speech-to-text, minimal typing |
| CHWs visit 15-20 patients on foot | **One-tap actions** — no multi-step forms or loading screens |
| Emergencies need instant response | **On-device risk scoring** — <200ms, zero network latency |

### Architectural Principles

1. **Offline-first, online-enhanced** — The app must never be blocked by network availability.
2. **Graceful degradation** — Every feature has a fallback path, down to fully offline deterministic rules.
3. **Safety over accuracy** — Deterministic safety rules always override ML predictions when they detect danger.
4. **Privacy by default** — Row Level Security (RLS) enforces data isolation at the database level.
5. **Idempotent everything** — Sync operations use idempotency keys to prevent duplicates on retry.
6. **Medical responsibility** — No drug dosages, no diagnoses, always refer to human healthcare providers.

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM BOUNDARY                                │
│                                                                        │
│  ┌─────────────────────────────────────────────┐                       │
│  │          CLIENT LAYER                       │                       │
│  │    React Native (Expo 55) · Android 8+      │                       │
│  │                                             │                       │
│  │  ┌────────┐ ┌───────┐ ┌──────┐ ┌────────┐  │                       │
│  │  │SQLite  │ │ ONNX  │ │Voice │ │ Sync   │  │                       │
│  │  │+ WAL   │ │XGBoost│ │STT/  │ │Worker  │  │                       │
│  │  │outbox  │ │<200ms │ │TTS   │ │2min bg │  │                       │
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
│  └───────────────────────────────────────────────────────────┘       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Client Layer — Mobile Application

### 3.1 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | React Native (Expo 55) | JS ecosystem alignment with backend; Expo Go for testing on cheap devices |
| Navigation | Expo Router + React Navigation | File-based routing, bottom tabs |
| Local DB | `expo-sqlite` with WAL mode | Atomic writes survive power cuts; WAL allows concurrent read/write |
| ML Runtime | `onnxruntime-react-native` | On-device XGBoost inference in <200ms |
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
│   ├── chat                         # Clinical AI chat
│   ├── medicine-verify              # Drug safety checker
│   └── profile                      # CHW profile + sync status
├── (mother)/                         # Mother-facing screens
│   ├── dashboard                     # Pregnancy tracker
│   └── qa                           # Q&A chat interface
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

### 3.4 On-Device Risk Model

The risk model runs a **dual-path** architecture:

1. **Learned path:** XGBoost model exported to ONNX, taking 5 features:
   - `bp_systolic`, `bp_diastolic`, `weight_kg`, `hemoglobin`, `gestational_age_weeks`

2. **Deterministic safety path:** Rule-based checks for critical conditions:
   - BP ≥ 140/90 → HIGH
   - Hemoglobin < 8 → HIGH
   - Blurred vision or severe headache → HIGH
   - Swelling + BP ≥ 130/85 → HIGH

3. **Merge logic:** `mergeWithSafety()` — safety rules always win if they flag higher risk.

```typescript
// Simplified prediction flow
async predict(input: RiskInput): Promise<RiskPrediction> {
  const safetyPrediction = safetyRules(input);      // Always runs
  const modelPrediction = await onnxInference(input); // May fail → fallback
  return mergeWithSafety(modelPrediction, safetyPrediction);
}
```

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

The chat service implements a **cascading LLM fallback** pattern:

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

### 5.2 System Prompt (Bangla)

The system prompt enforces strict behavioral constraints:

- **Language:** Bangla only
- **Scope:** Pregnancy, childbirth, maternal health, newborn care only
- **Prohibited:** Drug dosages, specific diagnoses
- **Emergency protocol:** Severe symptoms → "এখনই হাসপাতালে যান" (Go to hospital now)
- **Tone:** Warm, empathetic, 2-3 sentences max

### 5.3 Safety Filter Pipeline

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

### 5.4 RAG Pipeline (Future)

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
         │model.onnx│  │ Supabase │  │ Mobile App       │
         │ (2-5 MB) │  │ Postgres │  │ offline_qa table │
         │ on-device│  │ vectors  │  │ seeded at init   │
         └──────────┘  └──────────┘  └──────────────────┘
```

### 6.3 Storage Architecture

| Store | Engine | Contents | Scope |
|-------|--------|----------|-------|
| **Device SQLite** | expo-sqlite + WAL | patients, visits, outbox, offline_qa, sync_state | Per-device |
| **Supabase Postgres** | PostgreSQL 15 | chws, patients, visits, outbox_events, mothers, chat | Cloud (RLS-scoped) |
| **pgvector** | Supabase extension | WHO/DGHS guideline embeddings | Cloud (shared) |
| **ONNX Model** | onnxruntime-react-native | XGBoost risk classifier | Bundled with app |

---

## 7. Sync Architecture — Offline-First Design

### 7.1 The Outbox Pattern

The outbox pattern is the **cornerstone** of MaSheba's offline capability. Every write operation on the mobile device follows this sequence:

```
1. CHW records patient visit
2. Atomic SQLite transaction (WAL mode):
   a. INSERT/UPDATE patients table
   b. INSERT visits table
   c. INSERT outbox_events (status: PENDING)
3. ONNX model runs risk assessment
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
| LLM API timeout (>5s) | Cascade to next LLM → ONNX fallback |

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

## 10. Observability & Monitoring

### 10.1 Current Monitoring

| Component | Monitoring | Mechanism |
|-----------|-----------|-----------|
| Backend health | `/health` endpoint | Returns Supabase reachability status |
| Sync integrity | Outbox summary | `getOutboxSummary()` → pending/failed counts |
| Edge function | Supabase dashboard | Function logs, invocation counts |
| RLS verification | SQL tests | `rls_verify.sql` script |
| Sync stress | Automated test | `stress_sync.py` — 50 SYNCED / 50 DUPLICATE |

### 10.2 Admin Dashboard Metrics

| Metric | Source | Visualization |
|--------|--------|---------------|
| Patients by risk level | `v_risk_summary` view | Recharts stacked bar chart |
| CHW patient counts | `v_chw_list` view | Table with union/upazila info |
| CHW compliance rates | Visit frequency analysis | Dashboard card |

---

## 11. Scalability Considerations

### 11.1 Current Capacity (Hackathon)

| Dimension | Capacity |
|-----------|----------|
| Concurrent CHWs | ~200 (single Supabase project) |
| Patients per CHW | ~500 (SQLite budget ~50MB) |
| Visits per patient | ~20 (auto-pruning of SYNCED outbox rows) |
| LLM requests/min | ~60 (Groq free tier) |

### 11.2 Scale-Up Path

| Stage | Users | Changes Needed |
|-------|-------|---------------|
| Hackathon | 2-5 CHWs | Current setup |
| Pilot (1 upazila) | ~50 CHWs | Dedicated backend, monitoring |
| District (3 upazilas) | ~200 CHWs | Load balancer, read replicas |
| National | 5,000+ CHWs | Horizontal scaling, CDN, dedicated ML serving |

---

## 12. Failure Modes & Recovery

| Failure | Impact | Recovery |
|---------|--------|----------|
| **No network** | Sync paused | Outbox accumulates PENDING; auto-retries on reconnect |
| **Power cut mid-write** | Data could corrupt | WAL journal replays on next open — zero data loss |
| **All LLMs down** | Chat unavailable | Offline fallback message + on-device Q&A library |
| **ONNX model fails to load** | Risk scoring affected | Deterministic safety rules + mock risk model |
| **Supabase outage** | Sync blocked | Backend returns 500; mobile continues offline |
| **Device storage full** | App crash risk | Purge SYNCED outbox rows; storage pressure alert |
| **JWT expired** | Auth fails | Re-authenticate; outbox preserved for post-auth sync |

---

## 13. Future Architecture — On-Device LLM

### 13.1 Custom Model Training Path

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

### 13.2 Target On-Device Architecture

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
| ML runtime | TFLite vs ONNX | ONNX Runtime | Broader model support, XGBoost export via skl2onnx |
| Cloud DB | Firebase vs Supabase | Supabase | Postgres for SQL analytics + pgvector in same DB |
| Sync pattern | Firebase RTDB vs Outbox | Outbox | Idempotent, works offline, conflict-safe |
| LLM strategy | Single provider vs cascade | Cascade | Reliability; free tier alignment across providers |
| Safety approach | Post-filter vs system prompt | Both | Defense in depth — system prompt + code filters |
| Conflict resolution | CRDT vs LWW | LWW (device timestamp) | Single-owner domain; CRDTs are over-engineering |

---

> **This document is maintained by Team DareDevil and updated with each major architectural change.**
