-- Migration: Enforce CHW manual activation by default
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

  IF user_role = 'chw' THEN
    -- Basic parsing of entered clinic code to associate with known unions/upazilas
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

    -- Enforce is_active = false for manual admin approval
    INSERT INTO public.chws (auth_user_id, name, union_name, upazila, is_active)
    VALUES (new.id, user_name, chw_union, chw_upazila, false)
    ON CONFLICT (auth_user_id) DO NOTHING;

  ELSE
    -- Default to mother role
    gestational_weeks := coalesce((new.raw_user_meta_data->>'gestational_age_weeks')::integer, 12);
    IF gestational_weeks NOT BETWEEN 1 AND 45 THEN
      gestational_weeks := 12;
    END IF;

    INSERT INTO public.mothers (auth_user_id, name, phone, gestational_age_weeks, is_active)
    VALUES (
      new.id,
      user_name,
      new.raw_user_meta_data->>'phone',
      gestational_weeks,
      true
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;
