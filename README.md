<div align="center">

# 🤰 MaSheba AI

### *মা-সেবা — Every Mother Deserves a Safety Net*

**An offline-first, AI-powered maternal health assistant built for the realities of rural Bangladesh**

[![React Native](https://img.shields.io/badge/React_Native-Expo_55-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://expo.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Next.js](https://img.shields.io/badge/Next.js_14-Admin-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-On--Device_ML-7B2D8B?style=for-the-badge&logo=onnx&logoColor=white)](https://onnxruntime.ai)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br />

> **🏆 Built for The Infinity AI BuildFest 2026 by Team DareDevil**

</div>

---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Key Features](#-key-features)
- [Offline-First Architecture](#-offline-first-architecture)
- [AI & ML Pipeline](#-ai--ml-pipeline)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Future Roadmap](#-future-roadmap)
- [Team](#-team)
- [License](#-license)

---

## 🩺 The Problem

**Bangladesh has one of the highest maternal mortality rates in South Asia.** In rural areas, the situation is critical:

| Challenge | Reality |
|-----------|---------|
| 🌐 **Network** | Grameenphone 3G drops every 10–15 min; hours with no signal |
| 📱 **Devices** | ৳6,000–12,000 Android phones (2GB RAM, 16GB storage) |
| ⚡ **Power** | Load shedding keeps batteries at ~30% |
| 📝 **Literacy** | Semi-literate users — typing is hard, voice is natural |
| 🏃 **Workload** | CHWs visit 15–20 patients daily on foot — need one-tap actions |
| 🚨 **Emergencies** | Eclampsia and hemorrhage leave zero time for loading screens |

Community Health Workers (CHWs) serve as the primary touchpoint for pregnant women, yet they lack real-time clinical decision support, especially in areas with poor connectivity.

---

## 💡 Our Solution

**MaSheba AI** is an offline-first mobile application that puts a clinical safety net directly in the hands of Community Health Workers. It works when the network doesn't.

```
┌─────────────────────────────────────────────────────────────┐
│                    Elevator Pitch                            │
│                                                             │
│  "An AI-powered maternal health app that runs risk          │
│   assessments in <200ms with zero internet, syncs           │
│   when connected, and never leaves a mother without         │
│   a safety net — even during a power cut."                  │
└─────────────────────────────────────────────────────────────┘
```

### What Makes MaSheba Different

- **🔌 Works offline first** — Core risk assessment runs entirely on-device via ONNX
- **🤖 AI that degrades gracefully** — LLM cascade: Groq → Gemini → on-device rules
- **🛡️ Safety-filtered responses** — No drug dosages or diagnoses; always refers to hospitals
- **📊 Admin visibility** — Real-time dashboard for upazila health officers
- **🗣️ Voice-ready** — Bangla speech input for semi-literate users
- **🔒 Privacy by design** — Row Level Security ensures CHWs see only their patients

---

## 🏗️ System Architecture

<div align="center">

### Overall System Architecture

<img src="MaSheba_system_architecture.jpg" alt="MaSheba System Architecture" width="700"/>

<br /><br />

### Offline-First Data Flow

<img src="MaSheba_offline_data_flow.jpg" alt="Offline Data Flow — Outbox Pattern" width="700"/>

</div>

<br />

The system is organized into **three layers**, each independently deployable:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER — React Native (Expo) · Android 8+                       │
│                                                                        │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐ ┌───────────────────┐    │
│  │ SQLite   │ │ ONNX Risk    │ │ Voice     │ │ Background Sync   │    │
│  │ + WAL    │ │ Model        │ │ + TTS     │ │ Worker            │    │
│  │          │ │ XGBoost      │ │ Whisper   │ │ expo-background-  │    │
│  │ outbox   │ │ 8 vitals     │ │ Tiny      │ │ task (2 min poll) │    │
│  └──────────┘ └──────────────┘ └───────────┘ └───────────────────┘    │
│                                                                        │
│  Screens: Login · Dashboard · Risk Assessment · Patient Visit ·        │
│           Clinical Chat · Profile · Sync Status · Medicine Verify      │
└────────────────────────────┬───────────────────────────────────────────┘
                             │ outbox sync (batch)
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  BACKEND LAYER — FastAPI (Python) + Supabase (Postgres)                │
│                                                                        │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐ ┌───────────────────┐    │
│  │ API      │ │ AI           │ │ Notif     │ │ Analytics         │    │
│  │ Gateway  │ │ Orchestrator │ │ Service   │ │ Service           │    │
│  │ auth +   │ │ LangChain /  │ │ FCM/SMS/  │ │ CHW compliance    │    │
│  │ rate lim │ │ LangGraph    │ │ IVR       │ │ risk maps         │    │
│  └──────────┘ └──────────────┘ └───────────┘ └───────────────────┘    │
│                                                                        │
│  Supabase: Postgres + pgvector · RLS per CHW · Edge Functions          │
└────────────────────────────┬───────────────────────────────────────────┘
                             │ RAG query + LLM call
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  AI LAYER — LLM Cascade + RAG Pipeline                                 │
│                                                                        │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────────────────────┐    │
│  │ RAG      │ │ Safety       │ │ LLM Fallback Cascade             │    │
│  │ Retrieval│ │ Filter       │ │                                  │    │
│  │ pgvector │ │ strips drugs │ │ Groq Llama → Gemini Flash →     │    │
│  │ WHO/DGHS │ │ & diagnoses  │ │ On-device ONNX + Rules          │    │
│  └──────────┘ └──────────────┘ └──────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Mobile** | React Native (Expo 55) | JS ecosystem, Expo Go for cheap Android testing |
| **Local DB** | SQLite via `expo-sqlite` + WAL | Atomic writes survive power cuts |
| **On-Device ML** | XGBoost → ONNX via `onnxruntime-react-native` | 2–5MB model, <200ms inference, zero network |
| **Voice** | `react-native-voice` + Whisper Tiny (ONNX) | Offline Bangla speech-to-text |
| **Backend API** | FastAPI 0.115 (Python) | AI/ML team's language; async, type-safe |
| **Database** | Supabase (Postgres + pgvector) | SQL analytics + vector embeddings in one DB |
| **Auth & Privacy** | Supabase RLS | CHW-scoped data isolation without custom auth |
| **Edge Functions** | Supabase Edge (Deno) | `process_outbox_batch` RPC |
| **LLM Providers** | Groq (Llama 3.1 8B) → Gemini Flash | Cascading fallback for reliability |
| **Admin Dashboard** | Next.js 14 + Recharts | SSR, Vercel deployment, risk visualizations |
| **Sync Pattern** | Outbox + Background Task | Idempotent, conflict-safe, works on 3G |
| **CI Testing** | pytest + Jest | Backend + mobile unit/integration tests |

---

## 📁 Project Structure

```
MaSheba--AI/
│
├── mobile/                          # 📱 React Native (Expo) mobile app
│   ├── app/                         #    Expo Router screens
│   ├── src/
│   │   ├── api/                     #    API client (sync, chat)
│   │   ├── auth/                    #    Secure session management
│   │   ├── components/              #    Reusable UI components
│   │   │   ├── chat/                #      Chat bubbles, input
│   │   │   ├── emergency/           #      Emergency banners
│   │   │   ├── form/                #      Visit form fields
│   │   │   ├── navigation/          #      Tab & stack navigators
│   │   │   ├── nutrition/           #      Nutrition guidance cards
│   │   │   ├── patient/             #      Patient list & detail
│   │   │   ├── risk/                #      Risk badge, indicators
│   │   │   └── sync/                #      Sync status indicators
│   │   ├── context/                 #    React context providers
│   │   ├── data/                    #    Offline Q&A seed (Bangla)
│   │   ├── db/                      #    SQLite schema, outbox, CRUD
│   │   ├── features/
│   │   │   ├── mother/              #      Mother dashboard
│   │   │   └── qa/                  #      Offline Q&A chat
│   │   ├── model/                   #    ONNX risk model + safety rules
│   │   ├── notifications/           #    Push notification handlers
│   │   ├── screens/chw/             #    CHW-facing screens
│   │   ├── sync/                    #    Background sync worker
│   │   ├── theme/                   #    Design tokens & styling
│   │   ├── types/                   #    TypeScript type definitions
│   │   └── utils/                   #    Shared utilities
│   ├── assets/                      #    Fonts, images, model.onnx
│   ├── __tests__/                   #    Jest test suites
│   ├── app.json                     #    Expo configuration
│   └── package.json
│
├── backend/                         # ⚙️ FastAPI Python backend
│   ├── app/
│   │   ├── core/config.py           #    Environment & settings
│   │   ├── models/                  #    Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── health.py            #    GET /health
│   │   │   ├── sync.py              #    POST /sync (outbox batch)
│   │   │   └── chat.py              #    POST /chat (AI assistant)
│   │   ├── services/
│   │   │   ├── chat_service.py      #    LLM cascade (Groq → Gemini)
│   │   │   └── supabase_client.py   #    Supabase RPC & auth
│   │   └── main.py                  #    FastAPI app entrypoint
│   ├── tests/                       #    pytest test suites
│   └── requirements.txt
│
├── admin/                           # 📊 Next.js admin dashboard
│   ├── app/
│   │   ├── dashboard/               #    Dashboard page (SSR)
│   │   ├── layout.tsx               #    Root layout
│   │   └── globals.css
│   ├── components/
│   │   └── RiskSummaryChart.tsx      #    Recharts bar chart
│   ├── utils/                       #    Supabase server client
│   └── package.json
│
├── model/                           # 🧠 ML risk classifier pipeline
│   ├── config/
│   │   ├── feature_schema.json      #    ONNX input/output contract
│   │   └── risk_thresholds.json     #    Clinical threshold config
│   ├── scripts/
│   │   ├── profile_sources.py       #    Dataset profiling
│   │   ├── prepare_dataset.py       #    Feature engineering
│   │   ├── train_xgboost.py         #    XGBoost training
│   │   ├── export_onnx.py           #    ONNX export
│   │   ├── validate_model.py        #    WHO threshold validation
│   │   └── benchmark_onnx.py        #    Inference benchmarking
│   ├── artifacts/                   #    Trained model files (.onnx)
│   └── pyproject.toml
│
├── supabase/                        # 🗄️ Supabase infrastructure
│   ├── migrations/                  #    Postgres migration SQL files
│   │   ├── ..._create_core_schema.sql
│   │   ├── ..._rls_policies_and_views.sql
│   │   ├── ..._process_outbox_batch.sql
│   │   ├── ..._create_mothers_table.sql
│   │   └── ..._create_chat_tables.sql
│   ├── functions/
│   │   └── sync-outbox/             #    Deno edge function
│   ├── seed/                        #    Demo data for testing
│   └── tests/                       #    Stress test & RLS verification
│
├── docs/                            # 📄 Technical documentation
│   ├── API.md                       #    REST API reference
│   ├── SCHEMA.md                    #    Database schema docs
│   ├── SETUP.md                     #    Dev environment setup
│   └── SYNC_RUNBOOK.md              #    Sync verification playbook
│
├── MaSheba_system_architecture.jpg #    Architecture diagram
├── MaSheba_offline_data_flow.jpg   #    Offline data flow diagram
├── ARCHITECTURE.md                  #    Detailed architecture document
├── .env.example                     #    Environment variable template
└── .gitignore
```

---

## ✨ Key Features

### 👩‍⚕️ For Community Health Workers (CHWs)

| Feature | Status | Details |
|---------|--------|---------|
| 📋 **Patient Visit Recording** | ✅ | One-tap vitals entry (BP, weight, hemoglobin, symptoms) |
| 🎯 **Instant Risk Assessment** | ✅ | On-device ONNX model scores risk in <200ms |
| 💬 **Clinical AI Chat** | ✅ | Bangla maternal health Q&A with safety filters |
| 🔄 **Offline Sync** | ✅ | Outbox pattern with 2-min background polling |
| 💊 **Medicine Verification** | ✅ | Drug safety check for pregnant women |
| 📖 **Offline Q&A Library** | ✅ | Pre-seeded Bangla Q&A by trimester and topic |
| 🍎 **Nutrition Guidance** | ✅ | Trimester-specific nutritional recommendations |
| 🚨 **Emergency Alerts** | ✅ | Auto-detect critical symptoms → immediate referral |

### 👩 For Mothers

| Feature | Status | Details |
|---------|--------|---------|
| 🏠 **Mother Dashboard** | ✅ | Personal pregnancy tracker and information hub |
| ❓ **Q&A Chat** | ✅ | Ask health questions in Bangla (online + offline) |
| 📊 **Progress Tracking** | ✅ | Visualize pregnancy milestones and visit history |

### 👨‍💼 For Health Officers (Admin)

| Feature | Status | Details |
|---------|--------|---------|
| 📈 **Risk Summary Dashboard** | ✅ | Bar charts of LOW/MODERATE/HIGH patients per CHW |
| 👥 **CHW Management** | ✅ | View all CHWs, their unions, patient counts |
| 🗺️ **Geographic Coverage** | ✅ | Upazila-level aggregation and compliance rates |

---

## 📴 Offline-First Architecture

The offline-first design is the **single most critical architectural decision** in MaSheba. Here's how it works:

### The Outbox Pattern

```
    CHW Records Visit
          │
          ▼
  ┌─────────────────┐
  │  Atomic Write    │──── SQLite WAL mode ensures crash safety
  │  (WAL journal)   │     during power cuts
  │                  │
  │  patients table  │
  │  + outbox row    │──── PENDING status
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  ONNX Risk      │──── Runs on-device in <200ms
  │  Model Scores    │     Zero network required
  │                  │
  │  risk_level →    │──── Written back to local DB
  │  UI badge        │     Color-coded alert shown
  └────────┬────────┘
           │
     ┌─────┴─────┐
     │ Online?   │
     ├── YES ────┤──► Sync worker sends batch to Supabase
     │           │    Edge function: upsert + RLS check
     │           │    Outbox row → SYNCED
     │           │
     └── NO ─────┘──► Row stays PENDING
                      Retried on next 2-min poll
```

### Conflict Resolution

- **Strategy:** Last-Write-Wins with device timestamp
- **Why it's safe:** One CHW owns one patient record. No concurrent edits.
- **On tie:** Server timestamp wins

### Power Cut Safety

- **WAL journal mode** replays uncommitted writes on next app open — zero data loss
- **WAL checkpoint** runs at app resume
- **On-device SQLite budget:** ~50MB for 500 patients × 20 visits

---

## 🤖 AI & ML Pipeline

### On-Device Risk Model

```
Input (8 vitals)              XGBoost (ONNX, 2-5MB)         Output
┌──────────────┐    ┌──────────────────────────┐    ┌──────────────┐
│ bp_systolic   │    │                          │    │              │
│ bp_diastolic  │    │   Trained on Kaggle      │    │  risk_level  │
│ weight_kg     │───►│   maternal health data   │───►│  (LOW/MOD/   │
│ hemoglobin    │    │                          │    │   HIGH)      │
│ gest_age_wks  │    │   Exported via skl2onnx  │    │              │
└──────────────┘    └──────────────────────────┘    │  score       │
                                                     │  reasons[]   │
       Safety Rules (always-on override)              └──────────────┘
       ┌──────────────────────────────────┐
       │ BP ≥ 140/90 → HIGH              │
       │ Hemoglobin < 8 → HIGH           │
       │ Blurred vision → HIGH           │
       │ Swelling + elevated BP → HIGH   │
       │ Safety rules override ML if ↑   │
       └──────────────────────────────────┘
```

**Key design:** The ONNX model prediction is **always merged with deterministic safety rules**. If safety rules flag HIGH but the model says LOW, safety rules win. This ensures the system never misses a critical case, even if the model is wrong.

### LLM Cascade for Chat

```
Request ──► Groq (Llama 3.1 8B Instant)
              │
              ├── ✅ Success → Safety filter → Response
              │
              └── ❌ Fail/Timeout
                    │
                    ▼
              Gemini Flash (1.5 → 2.5)
                    │
                    ├── ✅ Success → Safety filter → Response
                    │
                    └── ❌ Fail/Timeout
                          │
                          ▼
                    Offline fallback message
                    "সংযোগ সমস্যা — অফলাইন তথ্য ব্যবহার করুন"
```

### Safety Filters

Every LLM response passes through validation:

1. **Language check** — Must contain Bangla characters (`[\u0980-\u09FF]`)
2. **Length normalization** — Capped at 3 sentences for readability
3. **Emergency detection** — Keywords like রক্তপাত (bleeding), খিঁচুনি (seizure) trigger hospital referral
4. **Medical safety** — No drug dosages, no diagnoses, always appends disclaimer
5. **Hallucination guard** — Rejects nonsensical or off-topic responses

### Training Pipeline

```bash
# 1. Download datasets
kaggle datasets download -d csafrit2/maternal-health-risk-data -p model/data/raw/

# 2. Profile & prepare
python model/scripts/profile_sources.py
python model/scripts/prepare_dataset.py --allow-partial

# 3. Train & export
python model/scripts/train_xgboost.py
python model/scripts/export_onnx.py

# 4. Validate against WHO thresholds
python model/scripts/validate_model.py

# 5. Benchmark inference speed
python model/scripts/benchmark_onnx.py
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 18 | Mobile + Admin |
| Python | ≥ 3.11 | Backend + ML pipeline |
| Expo CLI | Latest | Mobile development |
| Supabase CLI | Latest | Database migrations |
| Android device/emulator | API 26+ (Android 8) | Mobile testing |

### 1. Clone the Repository

```bash
git clone https://github.com/DigontaDas/MaSheba--AI.git
cd MaSheba--AI
```

### 2. Environment Setup

```bash
cp .env.example .env
# Fill in your Supabase and API keys
```

### 3. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
pytest                                    # Run tests
uvicorn app.main:app --reload             # Start server at :8000
```

### 4. Mobile App Setup

```bash
cd mobile
npm install
npx expo start                            # Start Expo dev server
# Press 'a' for Android emulator
```

### 5. Admin Dashboard Setup

```bash
cd admin
npm install
npm run dev                               # Start at :3000
```

### 6. Database Setup

```bash
supabase db push                          # Apply migrations
supabase functions deploy sync-outbox     # Deploy edge function
```

---

## 📡 API Reference

### `GET /health`

Health check endpoint. No auth required.

```json
{
  "status": "ok",
  "timestamp": "2026-05-20T03:30:00.000000Z",
  "supabase_reachable": true
}
```

### `POST /sync`

Accepts 1–100 outbox events. Requires `Authorization: Bearer <CHW JWT>`.

```json
// Request
{
  "events": [{
    "idempotency_key": "device-a-visit-001",
    "event_type": "visit_create",
    "device_id": "device-a",
    "payload": {
      "chw_id": "...",
      "patient_id": "...",
      "bp_systolic": 112,
      "bp_diastolic": 74,
      "risk_level": "LOW"
    }
  }]
}

// Response
{
  "results": [{ "idempotency_key": "device-a-visit-001", "status": "SYNCED" }],
  "synced_at": "2026-05-20T03:30:05.000Z"
}
```

Status values: `SYNCED` | `DUPLICATE` | `FAILED`

### `POST /chat`

AI-powered maternal health Q&A in Bangla.

```json
// Request
{ "question": "গর্ভাবস্থায় মাথাব্যথা হলে কী করব?" }

// Response
{
  "answer": "গর্ভাবস্থায় মাথাব্যথা হলে...",
  "is_emergency": false,
  "source": "groq",
  "emergency_text": null
}
```

> 📄 Full API documentation: [`docs/API.md`](docs/API.md)

---

## 🗃️ Database Schema

### Core Tables

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│    chws      │     │   patients   │     │     visits       │
│──────────────│     │──────────────│     │──────────────────│
│ id (PK)      │◄────│ chw_id (FK)  │     │ patient_id (FK)  │
│ auth_user_id │     │ name         │     │ chw_id (FK)      │
│ name         │     │ age          │     │ bp_systolic       │
│ union_name   │     │ gest_age_wks │     │ bp_diastolic      │
│ upazila      │     │ risk_level   │     │ weight_kg         │
│ is_active    │     │ created_at   │     │ hemoglobin        │
└──────────────┘     └──────────────┘     │ swelling_present  │
                                          │ symptom_flags     │
┌──────────────────┐                      │ risk_level        │
│  outbox_events   │                      │ visited_at        │
│──────────────────│                      └──────────────────┘
│ idempotency_key  │
│ chw_id           │
│ event_type       │
│ payload (JSONB)  │
│ status           │
└──────────────────┘
```

### Row Level Security (RLS)

- **CHWs** can only read/update their own row
- **Patients** are scoped to the owning CHW (`chw_id = current_chw_id()`)
- **Visits** are insert-only for the owning CHW — no delete, no cross-CHW reads
- **Outbox events** are insert-only — no CHW select (audit trail integrity)
- **Service role** bypasses RLS for backend/edge/admin operations

> 📄 Full schema documentation: [`docs/SCHEMA.md`](docs/SCHEMA.md)

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest                                    # Unit + integration tests
```

### Mobile Tests

```bash
cd mobile
npm test                                  # Jest test suite
```

### Sync Stress Test

```bash
# From project root (requires CHW_A_AUTH_TOKEN in .env)
python supabase/tests/stress_sync.py

# Expected: 50 SYNCED (first pass), 50 DUPLICATE (second pass)
```

### RLS Verification

```bash
npx supabase db query --linked --file supabase/tests/rls_verify.sql --output json

# Expected:
# - CHW_A sees only their patients
# - CHW_A cannot access CHW_B's patients
# - Cross-CHW INSERT is rejected by RLS
```

---

## 🌐 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| **Admin Dashboard** | Vercel | `https://MaSheba-admin.vercel.app/dashboard` |
| **Backend API** | Railway / Render / DigitalOcean | `http://your-api:8000` |
| **Database** | Supabase Cloud | `https://ibklmeyygujjddntbjsy.supabase.co` |
| **Edge Functions** | Supabase Edge | Auto-deployed with `supabase functions deploy` |
| **Mobile App** | Expo Go / APK Build | `expo build:android` |

### Vercel Deployment (Admin)

```bash
cd admin
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel deploy --prod
```

---

## 🔮 Future Roadmap

| Phase | Feature | Details |
|-------|---------|---------|
| 🔜 **v0.2** | Full RAG Pipeline | Embed WHO/DGHS guidelines in pgvector for context-aware AI |
| 🔜 **v0.2** | Whisper Voice Input | On-device Bangla speech-to-text via Whisper Tiny ONNX |
| 📅 **v0.3** | Coqui TTS | Offline Bangla text-to-speech for audio responses |
| 📅 **v0.3** | Geographic Heat Maps | Recharts + admin dashboard risk visualization |
| 📅 **v0.4** | SMS/IVR Notifications | Critical risk alerts via SMS for areas with no data |
| 🔭 **v1.0** | Custom Fine-Tuned LLM | Llama 3.1 8B fine-tuned with LoRA on real CHW data |
| 🔭 **v1.0** | On-Device LLM | GGUF 4-bit quantized model → 100% offline AI |

### Future Custom Model Path

```
6-12 months of CHW visit data (anonymized, doctor-labeled)
    │
    ▼
Fine-tune Llama 3.1 8B using LoRA
(1× A100 GPU, ~$50 on RunPod, one weekend)
    │
    ▼
Quantize to GGUF 4-bit (~4GB) via llama.cpp
    │
    ▼
Deploy on-device → Zero external dependencies
```

---

## 👥 Team

<div align="center">

### Team DareDevil

| Role | Name |
|------|------|
| 🎨 **UI/UX Design** | Mihir Das |
| ⚙️ **Backend Engineering** | Mehedi Hasan Nafis |
| 📊 **Business Analytics / Data Science** | Fayaz Bin Faruk |
| 🎤 **Presentation / Communication** | Hasnain Ashraf |
| 🗂️ **Project Manager** | Digonta Das |

</div>

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### 🇧🇩 Built with ❤️ for Bangladesh's mothers

*MaSheba (মা-শেবা) — "Service to Mother"*

**Every mother deserves a safety net. MaSheba ensures no one falls through.**

<br />

[![Stars](https://img.shields.io/github/stars/DigontaDas/MaSheba--AI?style=social)](https://github.com/DigontaDas/MaSheba--AI)
[![Forks](https://img.shields.io/github/forks/DigontaDas/MaSheba--AI?style=social)](https://github.com/DigontaDas/MaSheba--AI/fork)

</div>
