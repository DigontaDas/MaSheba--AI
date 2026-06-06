insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'chw-a@maasheba.local',
    crypt('CHW_A_demo_password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"CHW_A"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'chw-b@maasheba.local',
    crypt('CHW_B_demo_password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"CHW_B"}'::jsonb
  )
on conflict (id) do update set
  email = excluded.email,
  updated_at = now();

insert into public.chws (id, auth_user_id, name, union_name, upazila, is_active)
values
  ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-000000000001', 'CHW_A', 'Shibpur Union', 'Narsingdi Sadar', true),
  ('00000000-0000-0000-0000-0000000000b2', '20000000-0000-0000-0000-000000000002', 'CHW_B', 'Palash Union', 'Palash', true)
on conflict (id) do update set
  name = excluded.name,
  union_name = excluded.union_name,
  upazila = excluded.upazila,
  is_active = excluded.is_active;

insert into public.patients (id, chw_id, name, age, gestational_age_weeks, last_risk_level)
values
  ('11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-0000000000a1', 'আমিনা খাতুন', 24, 28, 'LOW'),
  ('11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-0000000000a1', 'রহিমা বেগম', 29, 32, 'MODERATE'),
  ('11111111-1111-1111-1111-111111111103', '00000000-0000-0000-0000-0000000000a1', 'শারমিন আক্তার', 21, 20, 'LOW'),
  ('11111111-1111-1111-1111-111111111104', '00000000-0000-0000-0000-0000000000a1', 'নাসিমা বেগম', 34, 34, 'HIGH'),
  ('11111111-1111-1111-1111-111111111105', '00000000-0000-0000-0000-0000000000a1', 'ফাতেমা আক্তার', 27, 26, 'MODERATE'),
  ('11111111-1111-1111-1111-111111111106', '00000000-0000-0000-0000-0000000000a1', 'জান্নাতুল ফেরদৌস', 19, 18, 'LOW'),
  ('22222222-2222-2222-2222-222222222201', '00000000-0000-0000-0000-0000000000b2', 'Rokeya Begum', 31, 30, 'HIGH'),
  ('22222222-2222-2222-2222-222222222202', '00000000-0000-0000-0000-0000000000b2', 'Mst Sultana', 25, 22, 'LOW'),
  ('22222222-2222-2222-2222-222222222203', '00000000-0000-0000-0000-0000000000b2', 'Lipi Akter', 28, 36, 'MODERATE'),
  ('22222222-2222-2222-2222-222222222204', '00000000-0000-0000-0000-0000000000b2', 'Khadija Begum', 22, 16, 'LOW')
on conflict (id) do update set
  name = excluded.name,
  age = excluded.age,
  gestational_age_weeks = excluded.gestational_age_weeks,
  last_risk_level = excluded.last_risk_level;

insert into public.visits (
  id,
  patient_id,
  chw_id,
  bp_systolic,
  bp_diastolic,
  weight_kg,
  hemoglobin,
  swelling_present,
  symptom_flags,
  risk_level,
  visited_at,
  device_id
)
values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-0000000000a1', 112, 74, 54.20, 11.4, false, '{"headache":false}'::jsonb, 'LOW', '2026-05-01T09:00:00Z', 'seed-device-a'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-0000000000a1', 134, 88, 59.00, 10.2, true, '{"headache":true}'::jsonb, 'MODERATE', '2026-05-02T09:20:00Z', 'seed-device-a'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111103', '00000000-0000-0000-0000-0000000000a1', 108, 70, 49.50, 12.1, false, '{}'::jsonb, 'LOW', '2026-05-02T10:15:00Z', 'seed-device-a'),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111104', '00000000-0000-0000-0000-0000000000a1', 156, 104, 64.00, 8.9, true, '{"headache":true,"blurred_vision":true}'::jsonb, 'HIGH', '2026-05-03T08:30:00Z', 'seed-device-a'),
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111105', '00000000-0000-0000-0000-0000000000a1', 128, 84, 57.30, 9.8, false, '{"dizziness":true}'::jsonb, 'MODERATE', '2026-05-04T11:00:00Z', 'seed-device-a'),
  ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111106', '00000000-0000-0000-0000-0000000000a1', 110, 72, 50.00, 11.8, false, '{}'::jsonb, 'LOW', '2026-05-04T12:00:00Z', 'seed-device-a'),
  ('33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-0000000000a1', 116, 76, 54.80, 11.3, false, '{}'::jsonb, 'LOW', '2026-05-08T09:00:00Z', 'seed-device-a'),
  ('33333333-3333-3333-3333-333333333308', '11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-0000000000a1', 138, 90, 59.40, 10.0, true, '{"headache":true}'::jsonb, 'MODERATE', '2026-05-09T09:45:00Z', 'seed-device-a'),
  ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201', '00000000-0000-0000-0000-0000000000b2', 160, 106, 62.50, 8.7, true, '{"headache":true,"blurred_vision":true}'::jsonb, 'HIGH', '2026-05-01T08:00:00Z', 'seed-device-b'),
  ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222202', '00000000-0000-0000-0000-0000000000b2', 114, 72, 52.00, 11.1, false, '{}'::jsonb, 'LOW', '2026-05-01T10:00:00Z', 'seed-device-b'),
  ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222203', '00000000-0000-0000-0000-0000000000b2', 132, 86, 58.10, 9.7, true, '{"dizziness":true}'::jsonb, 'MODERATE', '2026-05-03T13:00:00Z', 'seed-device-b'),
  ('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222204', '00000000-0000-0000-0000-0000000000b2', 112, 70, 48.50, 11.9, false, '{}'::jsonb, 'LOW', '2026-05-03T14:00:00Z', 'seed-device-b'),
  ('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222201', '00000000-0000-0000-0000-0000000000b2', 158, 102, 63.00, 8.6, true, '{"headache":true}'::jsonb, 'HIGH', '2026-05-07T08:30:00Z', 'seed-device-b'),
  ('44444444-4444-4444-4444-444444444406', '22222222-2222-2222-2222-222222222203', '00000000-0000-0000-0000-0000000000b2', 130, 84, 58.80, 9.9, false, '{"fatigue":true}'::jsonb, 'MODERATE', '2026-05-08T13:15:00Z', 'seed-device-b'),
  ('44444444-4444-4444-4444-444444444407', '22222222-2222-2222-2222-222222222202', '00000000-0000-0000-0000-0000000000b2', 116, 74, 52.20, 11.2, false, '{}'::jsonb, 'LOW', '2026-05-09T10:00:00Z', 'seed-device-b')
on conflict (id) do nothing;

insert into public.outbox_events (
  id,
  idempotency_key,
  chw_id,
  device_id,
  event_type,
  payload,
  status,
  error_message,
  synced_at
)
values
  ('55555555-5555-5555-5555-555555555501', 'seed-synced-001', '00000000-0000-0000-0000-0000000000a1', 'seed-device-a', 'patient_upsert', '{"chw_id":"00000000-0000-0000-0000-0000000000a1"}'::jsonb, 'SYNCED', null, now()),
  ('55555555-5555-5555-5555-555555555502', 'seed-synced-002', '00000000-0000-0000-0000-0000000000a1', 'seed-device-a', 'visit_create', '{"chw_id":"00000000-0000-0000-0000-0000000000a1"}'::jsonb, 'SYNCED', null, now()),
  ('55555555-5555-5555-5555-555555555503', 'seed-synced-003', '00000000-0000-0000-0000-0000000000b2', 'seed-device-b', 'visit_create', '{"chw_id":"00000000-0000-0000-0000-0000000000b2"}'::jsonb, 'SYNCED', null, now()),
  ('55555555-5555-5555-5555-555555555504', 'seed-pending-001', '00000000-0000-0000-0000-0000000000a1', 'seed-device-a', 'patient_upsert', '{"chw_id":"00000000-0000-0000-0000-0000000000a1"}'::jsonb, 'PENDING', null, null),
  ('55555555-5555-5555-5555-555555555505', 'seed-failed-001', '00000000-0000-0000-0000-0000000000b2', 'seed-device-b', 'visit_create', '{"chw_id":"00000000-0000-0000-0000-0000000000b2"}'::jsonb, 'FAILED', 'Demo failed event', null)
on conflict (idempotency_key) do update set
  status = excluded.status,
  error_message = excluded.error_message,
  synced_at = excluded.synced_at;
