-- Migration: Add district column to chws and update handle_new_user trigger to collect real locations
ALTER TABLE public.chws ADD COLUMN IF NOT EXISTS district TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
  user_clinic_code TEXT;
  chw_union TEXT;
  chw_upazila TEXT;
  chw_district TEXT;
  gestational_weeks INTEGER;
BEGIN
  -- Bypass trigger only for the exact seeded database demo accounts to avoid unique key conflicts during seeds
  IF new.email IN (
    'chw-a@maasheba.local',
    'chw-b@maasheba.local',
    'mother-amina@maasheba.local',
    'mother-rahima@maasheba.local',
    'mother-sharmin@maasheba.local',
    'mother-nasima@maasheba.local',
    'mother-fatema@maasheba.local',
    'mother-jannatul@maasheba.local'
  ) THEN
    RETURN new;
  END IF;

  user_role := lower(coalesce(new.raw_user_meta_data->>'role', ''));
  user_name := coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'User');
  user_clinic_code := new.raw_user_meta_data->>'clinic_code';

  -- Initialize locations from raw user metadata (defaulting to NULL)
  chw_union := coalesce(new.raw_user_meta_data->>'working_area', new.raw_user_meta_data->>'union_name', NULL);
  chw_upazila := coalesce(new.raw_user_meta_data->>'upazila', NULL);
  chw_district := coalesce(new.raw_user_meta_data->>'district', NULL);

  IF user_role = 'chw' OR user_role = 'health_worker' THEN
    -- Fallback legacy/test clinics matching logic
    IF user_clinic_code IS NOT NULL THEN
      IF lower(user_clinic_code) LIKE '%palash%' THEN
        chw_union := 'Palash Union';
        chw_upazila := 'Palash';
        chw_district := 'Narsingdi';
      ELSIF lower(user_clinic_code) LIKE '%putia%' OR lower(user_clinic_code) LIKE '%shibpur%' THEN
        chw_union := 'Putia Union';
        chw_upazila := 'Shibpur';
        chw_district := 'Narsingdi';
      ELSIF lower(user_clinic_code) LIKE '%radhanagar%' OR lower(user_clinic_code) LIKE '%raipura%' THEN
        chw_union := 'Radhanagar Union';
        chw_upazila := 'Raipura';
        chw_district := 'Narsingdi';
      END IF;
    END IF;

    INSERT INTO public.chws (
      auth_user_id,
      name,
      union_name,
      upazila,
      district,
      is_active,
      organization_name,
      worker_type,
      years_of_experience,
      certificate_url,
      verification_status
    )
    VALUES (
      new.id,
      user_name,
      chw_union,
      chw_upazila,
      chw_district,
      false,
      new.raw_user_meta_data->>'organization_name',
      new.raw_user_meta_data->>'worker_type',
      coalesce((new.raw_user_meta_data->>'years_of_experience')::integer, 0),
      new.raw_user_meta_data->>'certificate_url',
      'PENDING'
    )
    ON CONFLICT (auth_user_id) DO NOTHING;

  ELSIF user_role = 'mother' THEN
    gestational_weeks := coalesce((new.raw_user_meta_data->>'gestational_age_weeks')::integer, 12);
    IF gestational_weeks NOT BETWEEN 1 AND 45 THEN
      gestational_weeks := 12;
    END IF;

    INSERT INTO public.mothers (
      auth_user_id,
      name,
      phone,
      gestational_age_weeks,
      is_active,
      verification_status
    )
    VALUES (
      new.id,
      user_name,
      new.raw_user_meta_data->>'phone',
      gestational_weeks,
      true,
      'VERIFIED'
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;
