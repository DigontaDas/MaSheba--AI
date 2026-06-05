-- Migration: Add rejection reason to public.mothers
ALTER TABLE public.mothers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
