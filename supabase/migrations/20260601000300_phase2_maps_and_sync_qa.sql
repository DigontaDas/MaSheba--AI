-- Migration: 20260601000300_phase2_maps_and_sync_qa.sql

-- Create the master Q&A table for centralized maternal health FAQ syncing
CREATE TABLE IF NOT EXISTS public.master_qa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trimester TEXT NOT NULL CHECK (trimester IN ('T1', 'T2', 'T3', 'POSTPARTUM', 'ALL')),
    topic TEXT NOT NULL CHECK (length(trim(topic)) > 0),
    question_bn TEXT NOT NULL CHECK (length(trim(question_bn)) > 0),
    answer_bn TEXT NOT NULL CHECK (length(trim(answer_bn)) > 0),
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'HIGH')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for timestamp query filtering during incremental client sync
CREATE INDEX IF NOT EXISTS master_qa_updated_at_idx ON public.master_qa (updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.master_qa ENABLE ROW LEVEL SECURITY;

-- Allow select to authenticated users (CHWs and Mothers)
CREATE POLICY select_master_qa_policy ON public.master_qa
    FOR SELECT TO authenticated USING (true);

-- Allow all operations to the service_role (Admin server operations)
CREATE POLICY service_master_qa_policy ON public.master_qa
    FOR ALL TO service_role USING (true);

-- Create a database trigger to auto-update updated_at on modifications
DROP TRIGGER IF EXISTS master_qa_set_updated_at ON public.master_qa;
CREATE TRIGGER master_qa_set_updated_at
BEFORE UPDATE ON public.master_qa
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create the v_upazila_risk_heatmap view for administrative GIS visualizers
CREATE OR REPLACE VIEW public.v_upazila_risk_heatmap AS
SELECT 
    c.upazila,
    COUNT(CASE WHEN p.last_risk_level = 'HIGH' THEN 1 END)::integer AS high_count,
    COUNT(CASE WHEN p.last_risk_level = 'MODERATE' THEN 1 END)::integer AS moderate_count,
    COUNT(CASE WHEN p.last_risk_level = 'LOW' THEN 1 END)::integer AS low_count,
    COUNT(p.id)::integer AS total_patients
FROM public.patients p
JOIN public.chws c ON p.chw_id = c.id
GROUP BY c.upazila;
