-- ================================================================
-- Migration: 20260608001000_backfill_chw_location_from_metadata.sql
-- Purpose: Backfill correct district/upazila/union for CHW rows that
--          were incorrectly set by the old hardcoded trigger.
--
-- DEMO ACCOUNT PROTECTION:
--   This query will NOT touch any row where c.name ILIKE any of:
--   %demo%, %CHW_A%, %CHW_B%, %Abdul Hannan%, %Adbul Hannan%, %Korim%
-- ================================================================

-- STEP 1 (DRY RUN) — Run this SELECT first to see which rows would be changed.
-- Do NOT run the UPDATE below until the admin confirms this list is safe.
/*
SELECT
  c.id,
  c.name,
  c.upazila          AS current_upazila,
  c.district         AS current_district,
  c.union_name       AS current_union,
  u.raw_user_meta_data->>'district'     AS meta_district,
  u.raw_user_meta_data->>'upazila'      AS meta_upazila,
  u.raw_user_meta_data->>'working_area' AS meta_working_area
FROM public.chws c
JOIN auth.users u ON c.auth_user_id = u.id
WHERE
  -- Only rows that look like they were set by the old hardcoded trigger
  (c.upazila = 'Narsingdi Sadar' OR c.district IS NULL)
  -- And the auth metadata actually has better information
  AND (
    u.raw_user_meta_data->>'district'    IS NOT NULL OR
    u.raw_user_meta_data->>'upazila'     IS NOT NULL OR
    u.raw_user_meta_data->>'working_area' IS NOT NULL
  )
  -- DEMO ACCOUNT PROTECTION — never touch these rows
  AND c.name NOT ILIKE '%demo%'
  AND c.name NOT ILIKE '%CHW_A%'
  AND c.name NOT ILIKE '%CHW_B%'
  AND c.name NOT ILIKE '%Abdul Hannan%'
  AND c.name NOT ILIKE '%Adbul Hannan%'
  AND c.name NOT ILIKE '%Korim%'
ORDER BY c.name;
*/

-- STEP 2 — Only run this AFTER admin confirms the rows above are all safe.
UPDATE public.chws c
SET
  district   = COALESCE(u.raw_user_meta_data->>'district',   c.district),
  upazila    = COALESCE(u.raw_user_meta_data->>'upazila',    c.upazila),
  union_name = COALESCE(
                 u.raw_user_meta_data->>'working_area',
                 u.raw_user_meta_data->>'union_name',
                 c.union_name
               )
FROM auth.users u
WHERE c.auth_user_id = u.id
  -- Only rows that look like they were set by the old hardcoded trigger
  AND (c.upazila = 'Narsingdi Sadar' OR c.district IS NULL)
  -- And the auth metadata actually has better information
  AND (
    u.raw_user_meta_data->>'district'    IS NOT NULL OR
    u.raw_user_meta_data->>'upazila'     IS NOT NULL OR
    u.raw_user_meta_data->>'working_area' IS NOT NULL
  )
  -- DEMO ACCOUNT PROTECTION — never touch these rows
  AND c.name NOT ILIKE '%demo%'
  AND c.name NOT ILIKE '%CHW_A%'
  AND c.name NOT ILIKE '%CHW_B%'
  AND c.name NOT ILIKE '%Abdul Hannan%'
  AND c.name NOT ILIKE '%Adbul Hannan%'
  AND c.name NOT ILIKE '%Korim%';
