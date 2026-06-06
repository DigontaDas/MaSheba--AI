-- Migration: Automatic linking of Mother to CHW Patient record when CHW contact info is provided/updated
CREATE OR REPLACE FUNCTION public.handle_mother_chw_linking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matching_chw_id UUID;
  new_patient_id UUID;
  clean_phone TEXT;
BEGIN
  -- 1. Identify if CHW information is provided
  IF new.chw_email IS NULL AND new.chw_phone IS NULL THEN
    RETURN new;
  END IF;

  -- 2. Clean phone if provided
  IF new.chw_phone IS NOT NULL THEN
    clean_phone := trim(new.chw_phone);
  END IF;

  -- 3. Search for the CHW by email or phone
  IF new.chw_email IS NOT NULL THEN
    SELECT c.id INTO matching_chw_id
    FROM public.chws c
    JOIN auth.users u ON c.auth_user_id = u.id
    WHERE lower(u.email) = lower(trim(new.chw_email))
    LIMIT 1;
  END IF;

  IF matching_chw_id IS NULL AND clean_phone IS NOT NULL THEN
    -- Try matching phone in auth.users
    SELECT c.id INTO matching_chw_id
    FROM public.chws c
    JOIN auth.users u ON c.auth_user_id = u.id
    WHERE u.phone = clean_phone OR replace(u.phone, '+88', '') = replace(clean_phone, '+88', '')
    LIMIT 1;
  END IF;

  -- 4. If matching CHW is found, manage patient record
  IF matching_chw_id IS NOT NULL THEN
    IF new.patient_id IS NULL THEN
      -- Create new patient record
      INSERT INTO public.patients (
        chw_id,
        name,
        age,
        gestational_age_weeks,
        lmp_date,
        last_risk_level,
        created_at,
        updated_at
      )
      VALUES (
        matching_chw_id,
        new.name,
        25, -- default/mock age as it is not collected during mother signup
        coalesce(new.gestational_age_weeks, 12),
        new.lmp_date,
        'LOW',
        now(),
        now()
      )
      RETURNING id INTO new_patient_id;

      -- Set patient_id on the mother row being processed
      new.patient_id := new_patient_id;
    ELSE
      -- Mother already has a patient record. Update its CHW if it has changed.
      UPDATE public.patients
      SET chw_id = matching_chw_id,
          name = new.name,
          gestational_age_weeks = coalesce(new.gestational_age_weeks, gestational_age_weeks),
          lmp_date = coalesce(new.lmp_date, lmp_date),
          updated_at = now()
      WHERE id = new.patient_id;
    END IF;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trigger_mother_chw_linking ON public.mothers;

CREATE TRIGGER trigger_mother_chw_linking
BEFORE INSERT OR UPDATE ON public.mothers
FOR EACH ROW
EXECUTE FUNCTION public.handle_mother_chw_linking();

-- RLS Policy: Allow a Mother to select her own patient record
DROP POLICY IF EXISTS "mothers_select_own_patient_record" ON public.patients;
CREATE POLICY "mothers_select_own_patient_record" ON public.patients
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT patient_id FROM public.mothers
      WHERE auth_user_id = auth.uid()
    )
  );
