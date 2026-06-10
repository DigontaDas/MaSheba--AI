-- Migration: Add CHECK constraints to mothers columns
ALTER TABLE public.mothers 
  ADD CONSTRAINT valid_age 
  CHECK (age IS NULL OR (age >= 12 AND age <= 60));

ALTER TABLE public.mothers
  ADD CONSTRAINT valid_location_name_length
  CHECK (location_name IS NULL OR char_length(location_name) <= 200);
