-- Fix: Update passwords for the 2 seeded CHW accounts to cost 10 bcrypt.
-- This ensures GoTrue compatibility and resolves the "Database error querying schema" error.

UPDATE auth.users SET
  encrypted_password = crypt('CHW_A_demo_password', gen_salt('bf', 10)),
  updated_at = now()
WHERE email = 'chw-a@maasheba.local';

UPDATE auth.users SET
  encrypted_password = crypt('CHW_B_demo_password', gen_salt('bf', 10)),
  updated_at = now()
WHERE email = 'chw-b@maasheba.local';
