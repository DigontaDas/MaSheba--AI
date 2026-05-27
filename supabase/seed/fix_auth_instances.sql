-- Fix: Insert missing instance row into auth.instances.
-- When auth.instances is empty, GoTrue fails with "Database error querying schema".

INSERT INTO auth.instances (id, uuid, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
