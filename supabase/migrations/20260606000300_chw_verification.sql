-- Migration: Add CHW Verification Columns and Update Handle User Trigger

-- 1. Add verification and profile columns to public.chws
ALTER TABLE public.chws ADD COLUMN IF NOT EXISTS organization_name TEXT;
ALTER TABLE public.chws ADD COLUMN IF NOT EXISTS worker_type TEXT;
ALTER TABLE public.chws ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0;
ALTER TABLE public.chws ADD COLUMN IF NOT EXISTS certificate_url TEXT;
ALTER TABLE public.chws ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED'));
ALTER TABLE public.chws ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Update trigger function to handle the new metadata during signup
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
  chw_union TEXT := 'Shibpur Union';
  chw_upazila TEXT := 'Narsingdi Sadar';
  gestational_weeks INTEGER;
BEGIN
  -- Exclude seeding or test users ending in .local or .test to avoid unique key conflicts during database seeds
  IF new.email LIKE '%.local' OR new.email LIKE '%.test' THEN
    RETURN new;
  END IF;

  user_role := lower(coalesce(new.raw_user_meta_data->>'role', 'mother'));
  user_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  user_clinic_code := new.raw_user_meta_data->>'clinic_code';

  IF user_role = 'chw' OR user_role = 'health_worker' THEN
    -- Basic parsing of entered clinic code/area to associate with known unions/upazilas
    IF user_clinic_code IS NOT NULL THEN
      IF lower(user_clinic_code) LIKE '%palash%' THEN
        chw_union := 'Palash Union';
        chw_upazila := 'Palash';
      ELSIF lower(user_clinic_code) LIKE '%putia%' OR lower(user_clinic_code) LIKE '%shibpur%' THEN
        chw_union := 'Putia Union';
        chw_upazila := 'Shibpur';
      ELSIF lower(user_clinic_code) LIKE '%radhanagar%' OR lower(user_clinic_code) LIKE '%raipura%' THEN
        chw_union := 'Radhanagar Union';
        chw_upazila := 'Raipura';
      END IF;
    END IF;

    -- Enforce is_active = false for manual admin approval of CHW
    INSERT INTO public.chws (
      auth_user_id,
      name,
      union_name,
      upazila,
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
      coalesce(new.raw_user_meta_data->>'working_area', chw_union),
      chw_upazila,
      false, -- inactive by default
      new.raw_user_meta_data->>'organization_name',
      new.raw_user_meta_data->>'worker_type',
      coalesce((new.raw_user_meta_data->>'years_of_experience')::integer, 0),
      new.raw_user_meta_data->>'certificate_url',
      'PENDING'
    )
    ON CONFLICT (auth_user_id) DO NOTHING;

  ELSE
    -- Default to mother role
    gestational_weeks := coalesce((new.raw_user_meta_data->>'gestational_age_weeks')::integer, 12);
    IF gestational_weeks NOT BETWEEN 1 AND 45 THEN
      gestational_weeks := 12;
    END IF;

    -- Mothers are verified instantly (verification_status = 'VERIFIED') on registration
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
