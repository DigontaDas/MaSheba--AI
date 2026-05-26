BEGIN;

-- 1. Prune test patients and their dependencies
DELETE FROM public.visits WHERE patient_id IN (SELECT id FROM public.patients WHERE name ILIKE '%test%' OR name ILIKE '%edge%' OR name ILIKE '%stress%' OR name ILIKE '%smoke%');
DELETE FROM public.mothers WHERE patient_id IN (SELECT id FROM public.patients WHERE name ILIKE '%test%' OR name ILIKE '%edge%' OR name ILIKE '%stress%' OR name ILIKE '%smoke%');
DELETE FROM public.patients WHERE name ILIKE '%test%' OR name ILIKE '%edge%' OR name ILIKE '%stress%' OR name ILIKE '%smoke%';

-- 2. Clear old mother profile rows from public.mothers that match our 6 patients
DELETE FROM public.mothers WHERE patient_id IN (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111103',
  '11111111-1111-1111-1111-111111111104',
  '11111111-1111-1111-1111-111111111105',
  '11111111-1111-1111-1111-111111111106'
);

-- 3. Clear old auth users by email to avoid unique email conflicts
DELETE FROM auth.users WHERE email IN (
  'mother-amina@maasheba.local',
  'mother-rahima@maasheba.local',
  'mother-sharmin@maasheba.local',
  'mother-nasima@maasheba.local',
  'mother-fatema@maasheba.local',
  'mother-jannatul@maasheba.local'
);

-- 4. Insert the 6 mothers into auth.users
INSERT INTO auth.users (
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
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '50000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'mother-amina@maasheba.local',
    crypt('Mother_B_demo_password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true,"name":"Amina Khatun","role":"mother"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '50000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'mother-rahima@maasheba.local',
    crypt('Mother_B_demo_password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true,"name":"Rahima Begum","role":"mother"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '50000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'mother-sharmin@maasheba.local',
    crypt('Mother_B_demo_password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true,"name":"Sharmin Akter","role":"mother"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '50000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'mother-nasima@maasheba.local',
    crypt('Mother_B_demo_password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true,"name":"Nasima Begum","role":"mother"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '50000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'mother-fatema@maasheba.local',
    crypt('Mother_B_demo_password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true,"name":"Fatema Akter","role":"mother"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '50000000-0000-0000-0000-000000000006',
    'authenticated',
    'authenticated',
    'mother-jannatul@maasheba.local',
    crypt('Mother_B_demo_password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true,"name":"Jannatul Ferdous","role":"mother"}'::jsonb
  );

-- 5. Insert the 6 mothers into public.mothers table
INSERT INTO public.mothers (
  id,
  auth_user_id,
  name,
  patient_id,
  phone,
  gestational_age_weeks,
  is_active
)
VALUES
  (
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'Amina Khatun',
    '11111111-1111-1111-1111-111111111101',
    '+8801700000001',
    28,
    true
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000002',
    'Rahima Begum',
    '11111111-1111-1111-1111-111111111102',
    '+8801700000002',
    32,
    true
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    '50000000-0000-0000-0000-000000000003',
    'Sharmin Akter',
    '11111111-1111-1111-1111-111111111103',
    '+8801700000003',
    20,
    true
  ),
  (
    '60000000-0000-0000-0000-000000000004',
    '50000000-0000-0000-0000-000000000004',
    'Nasima Begum',
    '11111111-1111-1111-1111-111111111104',
    '+8801700000004',
    34,
    true
  ),
  (
    '60000000-0000-0000-0000-000000000005',
    '50000000-0000-0000-0000-000000000005',
    'Fatema Akter',
    '11111111-1111-1111-1111-111111111105',
    '+8801700000005',
    26,
    true
  ),
  (
    '60000000-0000-0000-0000-000000000006',
    '50000000-0000-0000-0000-000000000006',
    'Jannatul Ferdous',
    '11111111-1111-1111-1111-111111111106',
    '+8801700000006',
    18,
    true
  );

COMMIT;
