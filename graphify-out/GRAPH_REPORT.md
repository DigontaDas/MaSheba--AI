# MaaSheba Graphify Report

## Corpus Summary
- Backend: FastAPI gateway with health, sync, and chat routers plus a Supabase gateway service.
- Admin: Next.js dashboard that reads Supabase views and renders the CHW risk summary.
- Mobile: Expo Router app with CHW and mother shells, offline outbox sync, and QA/patient flows.
- Supabase: core schema, RLS, admin views, and the `sync-outbox` edge function.
- Model: risk-model README, XGBoost training pipeline, and execution/planning notes.
- Docs and plans: API, schema, setup, runbook, demo login, frontend replacement, and model improvement docs.

## God Nodes
1. Supabase Core Schema
2. Mobile Launch Route
3. Outbox Background Sync
4. Sync Router
5. sync-outbox Edge Function
6. Admin Dashboard Page
7. Risk Model README

## Surprising Connections
- `current_chw_id()` is the shared trust anchor between RLS and the sync validation path, so the database and the gateway both enforce the same CHW boundary.
- The launch route is not a dumb redirect; it rehydrates a stored session, checks live Supabase identity, and then chooses CHW or mother navigation from persisted role data.
- The admin dashboard does not read raw tables. It depends on `v_chw_list` and `v_risk_summary`, which turns schema views into a hard contract for the UI.
- The backend gateway and the edge function both reject cross-CHW payloads before writes, so the system has redundant protection against patient data leakage across workers.
- The model README explicitly rejects zero-filling unsupported clinical inputs, which means the risk pipeline is constrained by evidence coverage rather than silent imputation.

## Suggested Questions
- How many independent layers must agree before a CHW sync event is accepted?
- Where does the app decide CHW versus mother navigation, and what happens if stored auth is stale?
- How do the Supabase views and RLS policies shape what the admin dashboard can see?
- Which parts of the maternal-risk pipeline are learned, and which are deterministic safety rules?
- What is the weakest link in the offline-first sync path?

## Audit Trail
- Strongly evidenced: backend router wiring, sync auth checks, RLS/view contract, admin aggregation, offline sync loop, and the model data-coverage gate.
- Inferred: the exact QA chat backend path and the full mother feature stack, because those files were not fully inspected in this pass.
- Blocked from a full graphify run: the installed `graphify` CLI requires an LLM backend key or Ollama, and neither was available in this environment.

## Notes
This is a deterministic fallback graph built from direct reads of the workspace. It is intentionally honest about the missing semantic-backend step, but it still captures the project’s main architecture and the rationale documents that explain it.
