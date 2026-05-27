-- Fix: Insert missing auth.identities rows for the 2 seeded CHW accounts.
-- This resolves the "Database error querying schema" error.

INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  id
)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '{"sub":"10000000-0000-0000-0000-000000000001","email":"chw-a@maasheba.local","email_verified":true}'::jsonb,
    'email',
    now(),
    now(),
    now(),
    gen_random_uuid()
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    '{"sub":"20000000-0000-0000-0000-000000000002","email":"chw-b@maasheba.local","email_verified":true}'::jsonb,
    'email',
    now(),
    now(),
    now(),
    gen_random_uuid()
  )
ON CONFLICT (provider, provider_id) DO NOTHING;
