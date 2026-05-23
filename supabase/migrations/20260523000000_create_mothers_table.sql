-- Mothers table
CREATE TABLE public.mothers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id),
  phone TEXT,
  gestational_age_weeks INTEGER CHECK (
    gestational_age_weeks BETWEEN 1 AND 45
  ),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX mothers_auth_user_id_idx ON public.mothers(auth_user_id);
CREATE INDEX mothers_patient_id_idx ON public.mothers(patient_id);

-- RLS
ALTER TABLE public.mothers ENABLE ROW LEVEL SECURITY;

-- Mother can read/update only her own row
CREATE POLICY "mothers_select_own" ON public.mothers
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "mothers_update_own" ON public.mothers
  FOR UPDATE USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Service role unrestricted
CREATE POLICY "mothers_service_role" ON public.mothers
  FOR ALL USING (auth.role() = 'service_role');
