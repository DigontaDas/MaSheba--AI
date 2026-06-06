-- Fix auth profile routing and remove the accidental production admin mother row.
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
  IF new.email LIKE '%.local' OR new.email LIKE '%.test' THEN
    RETURN new;
  END IF;

  user_role := lower(coalesce(new.raw_user_meta_data->>'role', ''));
  user_name := coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'User');
  user_clinic_code := new.raw_user_meta_data->>'clinic_code';

  IF user_role = 'chw' OR user_role = 'health_worker' THEN
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DELETE FROM public.mothers m
USING auth.users u
WHERE m.auth_user_id = u.id
  AND u.email = 'mashebaai@gmail.com'
  AND lower(coalesce(u.raw_user_meta_data->>'role', '')) = 'admin'
  AND m.name = 'MaSheba Admin'
  AND m.phone IS NULL
  AND m.patient_id IS NULL;
