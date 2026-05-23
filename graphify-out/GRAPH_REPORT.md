# MaaSheba Graphify Report

## Corpus Summary
- Backend: ~6 Python files
- Admin: ~6 TypeScript/React files
- Mobile: ~8 TypeScript/React files
- Model: ~7 Python files plus configs/tests
- Supabase: migrations, seed, edge function, tests
- Docs: 4 markdown files
- Root: 1 execution plan markdown

## Key Nodes
1. FastAPI Backend Gateway
2. Admin Dashboard
3. Mobile App
4. Supabase Auth
5. Supabase Cloud DB
6. Sync Edge Function
7. Risk Model XGBoost Pipeline
8. Offline SQLite Cache
9. Community Health Workers
10. Patient Records
11. Data Services Layer
12. ML Artifacts and Reports

## Relationships
- Mobile App → Backend: sync and health requests over HTTP
- Admin Dashboard → Backend: health/status requests over HTTP
- Backend → Supabase Edge Function: sync forwarding
- Mobile/Admin → Supabase Auth: JWT authentication
- Mobile/Admin → Supabase DB: Supabase JS queries
- Edge Function → Supabase DB: validation and writes
- Mobile → Offline SQLite Cache: local offline-first storage
- Backend → Health Check: Supabase reachability checks
- Risk Model → Training Data: dataset ingestion
- Risk Model → ONNX Artifact: export path
- Model Pipeline → Feature Selection: tensor-position-based selection
- CHW Table → Auth Users: foreign-key linkage
- Patients Table → CHW Owner: ownership mapping
- Sync Outbox → Events Replay: idempotent queue pattern
- Admin → Risk Chart: visualization
- Mobile Voice → Transcription: voice input handling

## Clustered Communities
### Presentation Layer
- Mobile App
- Admin Dashboard
- UI assets

### Service and Sync Layer
- Backend Gateway
- Edge Function
- Auth flow

### Data and ML Layer
- Supabase schema
- Risk Model
- ML artifacts

## Audit
- Strongly evidenced: backend-supabase sync path, auth flow, offline sync pattern
- Uncertain: exact mobile background sync wiring, admin-to-model runtime integration, and PII logging enforcement

## Notes
This artifact was generated as a graphify-style workspace summary because the `graphify` package was not installed in the current environment.
