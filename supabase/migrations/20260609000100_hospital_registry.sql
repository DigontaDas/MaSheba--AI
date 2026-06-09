-- Create the hospitals table
CREATE TABLE public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  district text,
  upazila text,
  address text,
  phone text,
  location geography(Point, 4326),
  is_partner boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Public read access for authenticated users
CREATE POLICY "Public read access for authenticated users" 
ON public.hospitals FOR SELECT 
TO authenticated 
USING (true);

-- Admin write access only
CREATE POLICY "Admin write access only" 
ON public.hospitals FOR ALL 
TO authenticated 
USING (
  (auth.jwt() ->> 'role') = 'admin' OR 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND (admin_users.role = 'admin' OR admin_users.role = 'super_admin')
  )
)
WITH CHECK (
  (auth.jwt() ->> 'role') = 'admin' OR 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND (admin_users.role = 'admin' OR admin_users.role = 'super_admin')
  )
);

-- Create the get_nearby_hospitals RPC
CREATE OR REPLACE FUNCTION public.get_nearby_hospitals(
  lat double precision,
  lng double precision,
  radius_km double precision DEFAULT 15
) RETURNS TABLE (
  id uuid,
  name text,
  type text,
  district text,
  upazila text,
  address text,
  phone text,
  is_partner boolean,
  distance_km double precision
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.name,
    h.type,
    h.district,
    h.upazila,
    h.address,
    h.phone,
    h.is_partner,
    ST_Distance(h.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) / 1000.0 AS distance_km
  FROM 
    public.hospitals h
  WHERE 
    ST_DWithin(
      h.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000.0
    )
  ORDER BY 
    distance_km ASC;
END;
$$;

-- Seed the 5 demo hospitals
INSERT INTO public.hospitals (name, type, district, upazila, location, is_partner) VALUES
  ('Narsingdi District Hospital', 'government', 'Narsingdi', 'Narsingdi Sadar', ST_GeogFromText('SRID=4326;POINT(90.7153 23.9097)'), true),
  ('Narsingdi 250-Bed Hospital', 'government', 'Narsingdi', 'Narsingdi Sadar', ST_GeogFromText('SRID=4326;POINT(90.7201 23.9134)'), false),
  ('Popular Diagnostic Centre Narsingdi', 'private', 'Narsingdi', 'Narsingdi Sadar', ST_GeogFromText('SRID=4326;POINT(90.7089 23.9045)'), true),
  ('Shibpur Upazila Health Complex', 'government', 'Narsingdi', 'Shibpur', ST_GeogFromText('SRID=4326;POINT(90.6534 23.9678)'), false),
  ('Palash Community Clinic', 'clinic', 'Narsingdi', 'Palash', ST_GeogFromText('SRID=4326;POINT(90.6789 23.8934)'), false);
