-- Migration: 20260605183300_add_english_qa.sql

-- 1. Add question_en and answer_en columns allowing NULL initially
ALTER TABLE public.master_qa ADD COLUMN IF NOT EXISTS question_en TEXT;
ALTER TABLE public.master_qa ADD COLUMN IF NOT EXISTS answer_en TEXT;

-- 2. Seed existing rows' English content with their Bangla equivalents
UPDATE public.master_qa SET question_en = question_bn WHERE question_en IS NULL;
UPDATE public.master_qa SET answer_en = answer_bn WHERE answer_en IS NULL;

-- 3. Add NOT NULL constraints now that all rows are populated
ALTER TABLE public.master_qa ALTER COLUMN question_en SET NOT NULL;
ALTER TABLE public.master_qa ALTER COLUMN answer_en SET NOT NULL;

-- 4. Add length check constraints to prevent empty values
ALTER TABLE public.master_qa ADD CONSTRAINT check_question_en_length CHECK (length(trim(question_en)) > 0);
ALTER TABLE public.master_qa ADD CONSTRAINT check_answer_en_length CHECK (length(trim(answer_en)) > 0);
