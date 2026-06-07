-- Enable PostGIS extension (run once per project)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add location geography column to mothers table
ALTER TABLE public.mothers 
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Add location geography column to chws table
ALTER TABLE public.chws 
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Create spatial indexes for fast geolocation lookups
CREATE INDEX IF NOT EXISTS mothers_location_gix ON public.mothers USING GIST(location);
CREATE INDEX IF NOT EXISTS chws_location_gix ON public.chws USING GIST(location);

-- Create connection_requests table to manage assignments
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id      UUID NOT NULL REFERENCES public.mothers(id) ON DELETE CASCADE,
  chw_id         UUID REFERENCES public.chws(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'assigned', 'active', 'completed', 'cancelled')),
  mother_location geography(Point, 4326),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_at    TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS connection_requests_mother_idx ON public.connection_requests(mother_id);
CREATE INDEX IF NOT EXISTS connection_requests_chw_idx ON public.connection_requests(chw_id);
CREATE INDEX IF NOT EXISTS connection_requests_status_idx ON public.connection_requests(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Mothers can read/create/write their own requests
CREATE POLICY "mothers_own_requests" ON public.connection_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mothers 
      WHERE id = connection_requests.mother_id 
        AND auth_user_id = auth.uid()
    )
  );

-- Policy: CHWs can read/write requests assigned to them
CREATE POLICY "chws_assigned_requests" ON public.connection_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chws 
      WHERE id = connection_requests.chw_id 
        AND auth_user_id = auth.uid()
    )
  );

-- Policy: Admin / service role can manage all requests
CREATE POLICY "service_role_requests" ON public.connection_requests
  FOR ALL USING (auth.role() = 'service_role');


-- RPC: Search for nearby verified and active CHWs within radius
CREATE OR REPLACE FUNCTION public.find_nearby_chws(
  mother_lat FLOAT,
  mother_lng FLOAT,
  radius_km  FLOAT DEFAULT 10.0
)
RETURNS TABLE (
  chw_id       UUID,
  name         TEXT,
  union_name   TEXT,
  upazila      TEXT,
  distance_km  FLOAT,
  latitude     FLOAT,
  longitude    FLOAT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id AS chw_id,
    c.name,
    c.union_name,
    c.upazila,
    ROUND(
      (ST_Distance(
        c.location::geography,
        ST_SetSRID(ST_MakePoint(mother_lng, mother_lat), 4326)::geography
      ) / 1000.0)::numeric, 2
    )::float AS distance_km,
    ST_Y(c.location::geometry) AS latitude,
    ST_X(c.location::geometry) AS longitude
  FROM public.chws c
  WHERE
    c.is_active = true
    AND c.verification_status = 'APPROVED'
    AND c.location IS NOT NULL
    AND ST_DWithin(
      c.location::geography,
      ST_SetSRID(ST_MakePoint(mother_lng, mother_lat), 4326)::geography,
      radius_km * 1000  -- ST_DWithin uses meters
    )
  ORDER BY distance_km ASC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.find_nearby_chws TO authenticated, service_role;
