-- Final seed: creates 6 mothers with random UUIDs (no ON CONFLICT issues)
-- Since we deleted the old ones, this is a clean insert.

DO $$
DECLARE
  v_amina    uuid;
  v_rahima   uuid;
  v_sharmin  uuid;
  v_nasima   uuid;
  v_fatema   uuid;
  v_jannatul uuid;
BEGIN

  -- Generate random UUIDs
  v_amina    := gen_random_uuid();
  v_rahima   := gen_random_uuid();
  v_sharmin  := gen_random_uuid();
  v_nasima   := gen_random_uuid();
  v_fatema   := gen_random_uuid();
  v_jannatul := gen_random_uuid();

  -- Insert auth users one by one (using INSERT ... WHERE NOT EXISTS to be safe)
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT '00000000-0000-0000-0000-000000000000', v_amina, 'authenticated', 'authenticated',
    'mother-amina@maasheba.local', crypt('Mother_B_demo_password', gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true,"name":"আমিনা খাতুন","role":"mother"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mother-amina@maasheba.local');

  SELECT id INTO v_amina FROM auth.users WHERE email = 'mother-amina@maasheba.local';

  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT '00000000-0000-0000-0000-000000000000', v_rahima, 'authenticated', 'authenticated',
    'mother-rahima@maasheba.local', crypt('Mother_B_demo_password', gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true,"name":"রহিমা বেগম","role":"mother"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mother-rahima@maasheba.local');

  SELECT id INTO v_rahima FROM auth.users WHERE email = 'mother-rahima@maasheba.local';

  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT '00000000-0000-0000-0000-000000000000', v_sharmin, 'authenticated', 'authenticated',
    'mother-sharmin@maasheba.local', crypt('Mother_B_demo_password', gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true,"name":"শারমিন আক্তার","role":"mother"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mother-sharmin@maasheba.local');

  SELECT id INTO v_sharmin FROM auth.users WHERE email = 'mother-sharmin@maasheba.local';

  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT '00000000-0000-0000-0000-000000000000', v_nasima, 'authenticated', 'authenticated',
    'mother-nasima@maasheba.local', crypt('Mother_B_demo_password', gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true,"name":"নাসিমা বেগম","role":"mother"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mother-nasima@maasheba.local');

  SELECT id INTO v_nasima FROM auth.users WHERE email = 'mother-nasima@maasheba.local';

  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT '00000000-0000-0000-0000-000000000000', v_fatema, 'authenticated', 'authenticated',
    'mother-fatema@maasheba.local', crypt('Mother_B_demo_password', gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true,"name":"ফাতেমা আক্তার","role":"mother"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mother-fatema@maasheba.local');

  SELECT id INTO v_fatema FROM auth.users WHERE email = 'mother-fatema@maasheba.local';

  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT '00000000-0000-0000-0000-000000000000', v_jannatul, 'authenticated', 'authenticated',
    'mother-jannatul@maasheba.local', crypt('Mother_B_demo_password', gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true,"name":"জান্নাতুল ফেরদৌস","role":"mother"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mother-jannatul@maasheba.local');

  SELECT id INTO v_jannatul FROM auth.users WHERE email = 'mother-jannatul@maasheba.local';

  -- Update passwords to bcrypt cost 10 (GoTrue requirement)
  UPDATE auth.users SET
    encrypted_password = crypt('Mother_B_demo_password', gen_salt('bf', 10)),
    updated_at = now()
  WHERE email IN (
    'mother-amina@maasheba.local', 'mother-rahima@maasheba.local',
    'mother-sharmin@maasheba.local', 'mother-nasima@maasheba.local',
    'mother-fatema@maasheba.local', 'mother-jannatul@maasheba.local'
  );

  -- Delete old identities if any
  DELETE FROM auth.identities WHERE user_id IN (v_amina, v_rahima, v_sharmin, v_nasima, v_fatema, v_jannatul);

  -- Insert fresh identities
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
  VALUES
    (v_amina::text, v_amina,
     jsonb_build_object('sub', v_amina, 'email', 'mother-amina@maasheba.local', 'email_verified', true),
     'email', now(), now(), now(), gen_random_uuid()),
    (v_rahima::text, v_rahima,
     jsonb_build_object('sub', v_rahima, 'email', 'mother-rahima@maasheba.local', 'email_verified', true),
     'email', now(), now(), now(), gen_random_uuid()),
    (v_sharmin::text, v_sharmin,
     jsonb_build_object('sub', v_sharmin, 'email', 'mother-sharmin@maasheba.local', 'email_verified', true),
     'email', now(), now(), now(), gen_random_uuid()),
    (v_nasima::text, v_nasima,
     jsonb_build_object('sub', v_nasima, 'email', 'mother-nasima@maasheba.local', 'email_verified', true),
     'email', now(), now(), now(), gen_random_uuid()),
    (v_fatema::text, v_fatema,
     jsonb_build_object('sub', v_fatema, 'email', 'mother-fatema@maasheba.local', 'email_verified', true),
     'email', now(), now(), now(), gen_random_uuid()),
    (v_jannatul::text, v_jannatul,
     jsonb_build_object('sub', v_jannatul, 'email', 'mother-jannatul@maasheba.local', 'email_verified', true),
     'email', now(), now(), now(), gen_random_uuid());

  -- Upsert public.mothers
  INSERT INTO public.mothers (auth_user_id, name, patient_id, phone, gestational_age_weeks, is_active, chw_email)
  VALUES
    (v_amina,    'আমিনা খাতুন',    '11111111-1111-1111-1111-111111111101', '+8801700000001', 28, true, 'chw-a@maasheba.local'),
    (v_rahima,   'রহিমা বেগম',    '11111111-1111-1111-1111-111111111102', '+8801700000002', 32, true, 'chw-a@maasheba.local'),
    (v_sharmin,  'শারমিন আক্তার',   '11111111-1111-1111-1111-111111111103', '+8801700000003', 20, true),
    (v_nasima,   'নাসিমা বেগম',    '11111111-1111-1111-1111-111111111104', '+8801700000004', 34, true),
    (v_fatema,   'ফাতেমা আক্তার',    '11111111-1111-1111-1111-111111111105', '+8801700000005', 26, true),
    (v_jannatul, 'জান্নাতুল ফেরদৌস','11111111-1111-1111-1111-111111111106', '+8801700000006', 18, true)
  ON CONFLICT (auth_user_id) DO UPDATE SET
    name = EXCLUDED.name,
    patient_id = EXCLUDED.patient_id,
    phone = EXCLUDED.phone,
    gestational_age_weeks = EXCLUDED.gestational_age_weeks,
    is_active = true;

  RAISE NOTICE 'SUCCESS: amina=%, rahima=%, sharmin=%, nasima=%, fatema=%, jannatul=%',
    v_amina, v_rahima, v_sharmin, v_nasima, v_fatema, v_jannatul;
END $$;

-- Final verification
SELECT u.email, left(u.encrypted_password, 7) as hash_ok, count(i.id) as identities
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id
WHERE u.email LIKE 'mother-%'
GROUP BY u.email, u.encrypted_password
ORDER BY u.email;
