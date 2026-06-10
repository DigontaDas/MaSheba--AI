-- Migration: Add mother age and location_name
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age BETWEEN 10 AND 60);
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS location_name TEXT;
