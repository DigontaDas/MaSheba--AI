-- Migration: Fix RLS infinite recursion on patients table select policy
CREATE OR REPLACE FUNCTION public.get_mother_patient_id(user_uid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT patient_id
  FROM public.mothers
  WHERE auth_user_id = user_uid
  LIMIT 1;
$$;

-- Grant permissions to execute the helper function
REVOKE EXECUTE ON FUNCTION public.get_mother_patient_id(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.get_mother_patient_id(UUID) TO authenticated, service_role;

-- Re-create RLS Policy to use the security definer function and avoid recursive policy evaluation
DROP POLICY IF EXISTS "mothers_select_own_patient_record" ON public.patients;

CREATE POLICY "mothers_select_own_patient_record" ON public.patients
  FOR SELECT
  TO authenticated
  USING (
    id = public.get_mother_patient_id(auth.uid())
  );
