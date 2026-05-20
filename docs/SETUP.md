# MaaSheba AI Backend Setup

## Directory Map

- `backend/` - FastAPI sync gateway.
- `supabase/` - migrations, edge function, seed, and sync tests.
- `admin/` - Next.js 14 internal admin dashboard.
- `docs/` - API, schema, and runbook docs.

## Root Environment Variables

| Variable | Required | Scope |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Backend and stress test |
| `SUPABASE_ANON_KEY` | Yes | Backend health check and edge user client |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only edge/admin operations |
| `CHW_A_AUTH_TOKEN` | For live stress/RLS | Stress test |
| `CHW_B_AUTH_TOKEN` | For live RLS | Manual verification |

## Backend Local Setup

The backend sync gateway authenticates directly against Supabase and calls the `process_outbox_batch` RPC, so the backend no longer depends on a deployed edge function for the live sync path.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload
```

## Admin Local Setup

```powershell
cd admin
npm install
npm run build
npm run dev
```

`admin/.env.local` must include:

```powershell
NEXT_PUBLIC_SUPABASE_URL=https://ibklmeyygujjddntbjsy.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<provided publishable key>
SUPABASE_SERVICE_ROLE_KEY=<server-only service-role JWT>
```

Never prefix the service-role key with `NEXT_PUBLIC_`.

## Supabase Setup

```powershell
supabase db push
supabase functions deploy sync-outbox
```

Set function secrets:

```powershell
supabase secrets set SUPABASE_URL=https://ibklmeyygujjddntbjsy.supabase.co
supabase secrets set SUPABASE_ANON_KEY=<provided anon JWT>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<provided service-role JWT>
```

## Vercel Dashboard Deploy

From `admin/`:

```powershell
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel deploy
```

Deployment verification is `BLOCKED` until Vercel auth and `VERCEL_PROJECT_NAME` are available.

## Required Verification Gates

- `pytest` in `backend/`.
- `python supabase/tests/stress_sync.py`.
- RLS direct-query verification using CHW_A and CHW_B authenticated contexts.
- `npm run build` in `admin/`.
- Dashboard loads CHW list and risk chart from `v_chw_list` and `v_risk_summary`.
