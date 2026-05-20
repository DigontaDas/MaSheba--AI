# MaaSheba AI Supabase Schema

## Tables

### `public.chws`

Community health worker identity table.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `auth_user_id` | `uuid` | Unique, references `auth.users(id)` |
| `name` | `text` | Required |
| `union_name` | `text` | Required |
| `upazila` | `text` | Required |
| `is_active` | `boolean` | Defaults to `true` |
| `created_at` | `timestamptz` | Defaults to `now()` |

### `public.patients`

Pregnant patient records assigned to one CHW.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `chw_id` | `uuid` | References `chws(id)` |
| `name` | `text` | Required PII |
| `age` | `integer` | 10-60 check |
| `gestational_age_weeks` | `integer` | 1-45 check |
| `last_risk_level` | `risk_level` | `LOW`, `MODERATE`, `HIGH` |
| `created_at` | `timestamptz` | Defaults to `now()` |
| `updated_at` | `timestamptz` | Maintained by trigger |

### `public.visits`

Vitals and risk assessment records.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `patient_id` | `uuid` | References `patients(id)` |
| `chw_id` | `uuid` | References `chws(id)` |
| `bp_systolic` | `integer` | 60-260 check |
| `bp_diastolic` | `integer` | 30-180 check |
| `weight_kg` | `numeric(5,2)` | 25-200 check |
| `hemoglobin` | `numeric(4,1)` | 3-20 check |
| `swelling_present` | `boolean` | Required |
| `symptom_flags` | `jsonb` | Symptom booleans |
| `risk_level` | `risk_level` | Visit risk |
| `visited_at` | `timestamptz` | Device visit time |
| `device_id` | `text` | Required |
| `created_at` | `timestamptz` | Defaults to `now()` |

### `public.outbox_events`

Cloud-side audit of processed sync events.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `idempotency_key` | `text` | Unique |
| `chw_id` | `uuid` | References `chws(id)` |
| `device_id` | `text` | Required |
| `event_type` | `text` | `patient_upsert` or `visit_create` |
| `payload` | `jsonb` | Original event payload |
| `status` | `outbox_status` | `PENDING`, `SYNCED`, `DUPLICATE`, `FAILED` |
| `error_message` | `text` | Failure reason |
| `created_at` | `timestamptz` | Defaults to `now()` |
| `synced_at` | `timestamptz` | Set for synced events |

## Indexes

- `patients(chw_id)`
- `patients(last_risk_level)`
- `visits(chw_id)`
- `visits(visited_at desc)`
- `outbox_events(chw_id)`
- `outbox_events(status)`
- `outbox_events(idempotency_key)` unique

## RLS Summary

- `chws`: authenticated CHWs can select/update only their own row.
- `patients`: authenticated CHWs can select/insert/update only patients where `chw_id = current_chw_id()`.
- `visits`: authenticated CHWs can select/insert only their own visits. No CHW update/delete policy exists.
- `outbox_events`: authenticated CHWs can insert their own events only. No CHW select policy exists.
- Service role bypasses RLS for backend/edge/admin operations.

## Views

### `public.v_chw_list`

Admin view with `chw_id`, `name`, `union_name`, `upazila`, `is_active`, and `patient_count`.

### `public.v_risk_summary`

Admin view with `chw_id`, `chw_name`, `low_count`, `moderate_count`, and `high_count`.

## RPC

### `public.process_outbox_batch(events jsonb)`

Processes an array of outbox events. Existing `idempotency_key` values return `DUPLICATE`. New valid events write patient/visit data and an outbox row with `SYNCED`. Invalid events return `FAILED`.
