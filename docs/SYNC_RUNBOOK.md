# MaaSheba AI Sync Runbook

## 1. Prepare Environment

Create root `.env` from `.env.example` and fill:

```powershell
SUPABASE_URL=https://ibklmeyygujjddntbjsy.supabase.co
SUPABASE_ANON_KEY=<provided anon JWT>
SUPABASE_SERVICE_ROLE_KEY=<provided service-role JWT>
# SUPABASE_EDGE_SYNC_URL is optional; only needed if you want to exercise the edge function directly.
CHW_A_AUTH_TOKEN=<real CHW_A Supabase access token>
CHW_B_AUTH_TOKEN=<real CHW_B Supabase access token>
```

Do not add secrets to committed files or docs.

## 2. Run Migrations

From the project root:

```powershell
supabase db push
```

For local Supabase:

```powershell
supabase start
supabase db reset
```

## 3. Seed Demo Data

```powershell
supabase db reset
```

or apply `supabase/seed/seed.sql` manually in SQL editor after migrations.

Seeded CHWs:

- CHW_A auth user id: `10000000-0000-0000-0000-000000000001`
- CHW_B auth user id: `20000000-0000-0000-0000-000000000002`

## 4. Deploy Edge Function

Deploy `sync-outbox` to exercise the Deno edge function directly.

```powershell
npx supabase functions deploy sync-outbox
```

Supabase reserves the `SUPABASE_` environment names used by Edge Functions. In this project, attempting to set `SUPABASE_SERVICE_ROLE_KEY` manually with the CLI returned:

```powershell
Env name cannot start with SUPABASE_, skipping: SUPABASE_SERVICE_ROLE_KEY
```

Final live deployment on May 20, 2026:

- `npx supabase functions deploy sync-outbox`
- CLI evidence: `Deployed Functions on project ibklmeyygujjddntbjsy: sync-outbox`
- `npx supabase functions list` evidence: `sync-outbox`, status `ACTIVE`, version `1`, updated `2026-05-19 22:23:37 UTC`
- Valid CHW_A smoke test: HTTP `200`, status `SYNCED`, idempotency key `edge-smoke-1779229455-6c46eb52`
- Cross-CHW smoke test: HTTP `403`, error code `FORBIDDEN`, idempotency key `edge-cross-chw-1779229477-98d6127f`

## 5. Start FastAPI

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

## 6. Run Stress Test

Set `CHW_A_AUTH_TOKEN` in root `.env`, then:

```powershell
python supabase\tests\stress_sync.py
```

Expected result:

- First pass: 50 `SYNCED`
- Second pass: 50 `DUPLICATE`

## 7. Verify RLS

After seed data and CHW auth setup, run:

```powershell
npx supabase db query --linked --file supabase\tests\rls_verify.sql --output json
```

Expected results:

- CHW_A visible patients: count matches CHW_A-owned patients after stress-test inserts.
- CHW_A direct query for CHW_B patients: `0`.
- CHW_A cross-CHW INSERT using CHW_B `chw_id`: rejected with an RLS policy error.

If JWT/auth setup is missing, mark RLS live verification as `BLOCKED`, not `PASS`.

Final live verification on May 20, 2026:

- `chw_a_visible_patient_count = 56`
- `chw_a_visible_chw_b_patient_count = 0`
- `chw_a_cross_chw_insert_rejected = true`
- INSERT rejection evidence: `new row violates row-level security policy for table "patients"`

Full evidence is recorded in `supabase/tests/rls_verify_report.md`.

## 8. Cross-CHW Rejection

Send a `/sync` request using CHW_A token but set `payload.chw_id` to CHW_B id. Expected response:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Event payload CHW does not match the authenticated CHW."
  }
}
```

## 9. Admin Dashboard Live Verification

Start the dashboard:

```powershell
cd admin
npm run dev
```

Final live verification on May 20, 2026:

- Next.js dev server started on `http://localhost:3000`.
- `GET /dashboard` returned HTTP `200`.
- Server-rendered dashboard HTML contained `CHW_A`, `CHW_B`, `Shibpur Union`, `Palash Union`, `56`, and `4`.
- Direct live REST evidence for `v_risk_summary` returned `CHW_A` counts `LOW=20`, `MODERATE=19`, `HIGH=17` and `CHW_B` counts `LOW=2`, `MODERATE=1`, `HIGH=1`.
- `RiskSummaryChart` maps `low_count`, `moderate_count`, and `high_count` to Recharts `LOW`, `MODERATE`, and `HIGH` bars.

## 10. Edge Function Deployment Evidence (May 19, 2026)

- Functions list (CLI):

  - ID: c92afa86-d432-4d9c-9b60-52afb540defc
  - NAME: sync-outbox
  - SLUG: sync-outbox
  - STATUS: ACTIVE
  - VERSION: 1
  - UPDATED_AT (UTC): 2026-05-19 22:23:37

- Secrets (CLI): `SUPABASE_SERVICE_ROLE_KEY` is present in the project secrets (do not expose the secret value in docs).

- Smoke test results (edge function URL POSTs using `CHW_A_AUTH_TOKEN` from root `.env`):

  - Valid CHW_A event: HTTP 200
    - Response body: {"results":[{"status":"SYNCED","idempotency_key":"deploy-smoke-1"}],"synced_at":"2026-05-19T22:29:09.431Z"}

  - Cross-CHW event (payload.chw_id set to CHW_B): HTTP 403
    - Response body: {"error":{"code":"FORBIDDEN","message":"Event payload CHW does not match the authenticated CHW.","details":{"idempotency_key":"deploy-smoke-cross-1"}}}

Notes:

- The function was already deployed and active before these steps; secrets were present so no `supabase secrets set` was required.
- If you want a full deployment log, run `npx supabase functions deploy sync-outbox` locally and paste the CLI output here; I can help interpret or patch any Deno errors if they appear.
