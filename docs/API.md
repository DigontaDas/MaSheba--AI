# MaaSheba AI Backend API

Base URL for local development: `http://127.0.0.1:8000`

The FastAPI service is a thin backend gateway for the MaaSheba offline-first sync flow. It validates request shape, checks basic auth header presence, forwards sync batches to the Supabase Edge Function, and returns the edge function result shape unchanged.

## Authentication

- `GET /health` does not require authentication.
- `POST /sync` requires `Authorization: Bearer <CHW JWT>`.
- The JWT must represent a Supabase authenticated user linked to an active row in `public.chws`.
- Patient PII must not be logged by clients or server code.

## Error Format

FastAPI validation errors use the standard `422` Pydantic response. Gateway errors use this shape:

```json
{
  "detail": {
    "code": "UNAUTHORIZED",
    "message": "Bearer token is required."
  }
}
```

Supabase Edge Function errors use:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Event payload CHW does not match the authenticated CHW.",
    "details": {
      "idempotency_key": "event-001"
    }
  }
}
```

## `GET /health`

Returns service status and whether Supabase REST is reachable with configured keys.

### Response `200`

```json
{
  "status": "ok",
  "timestamp": "2026-05-20T03:30:00.000000Z",
  "supabase_reachable": true
}
```

## `POST /sync`

Accepts a batch of 1 to 100 outbox events and forwards them to `sync-outbox`.

### Request Headers

```http
Authorization: Bearer <CHW JWT>
Content-Type: application/json
```

### Request Body

```json
{
  "events": [
    {
      "idempotency_key": "device-a-visit-001",
      "event_type": "visit_create",
      "device_id": "device-a",
      "payload": {
        "chw_id": "00000000-0000-0000-0000-0000000000a1",
        "patient_id": "11111111-1111-1111-1111-111111111101",
        "visit_id": "33333333-3333-3333-3333-333333333301",
        "patient": {
          "name": "Amina Khatun",
          "age": 24,
          "gestational_age_weeks": 28,
          "last_risk_level": "LOW"
        },
        "bp_systolic": 112,
        "bp_diastolic": 74,
        "weight_kg": 54.2,
        "hemoglobin": 11.4,
        "swelling_present": false,
        "symptom_flags": {
          "headache": false
        },
        "risk_level": "LOW",
        "visited_at": "2026-05-20T03:30:00Z"
      }
    }
  ]
}
```

### Response `200`

```json
{
  "results": [
    {
      "idempotency_key": "device-a-visit-001",
      "status": "SYNCED"
    }
  ],
  "synced_at": "2026-05-20T03:30:05.000Z"
}
```

### Status Semantics

- `SYNCED`: event was accepted and persisted.
- `DUPLICATE`: `idempotency_key` already exists; no duplicate patient/visit is created.
- `FAILED`: event failed validation or persistence; `error` may be present.

### Important Error Codes

- `401 UNAUTHORIZED`: missing/invalid bearer token.
- `403 FORBIDDEN`: authenticated user is not an active CHW, or payload `chw_id` does not match the authenticated CHW.
- `422`: request body fails FastAPI/Pydantic validation.
- `500 SYNC_RPC_ERROR`: edge function could not call the database RPC.
