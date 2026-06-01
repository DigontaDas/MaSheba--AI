-- Migration: 20260601000200_phase1_rag_and_sms_failures.sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the guideline chunks table (384 dimensions for sentence-transformers/all-MiniLM-L6-v2)
CREATE TABLE public.guideline_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN ('WHO', 'DGHS')),
    chapter TEXT,
    content TEXT NOT NULL,
    embedding vector(384),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HNSW Vector Index for High Performance similarity search using cosine distance
CREATE INDEX guideline_chunks_hnsw_idx 
ON public.guideline_chunks USING hnsw (embedding vector_cosine_ops);

-- Similarity Matching Function
CREATE OR REPLACE FUNCTION public.match_guidelines (
    query_embedding vector(384),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    id UUID,
    source TEXT,
    chapter TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        gc.id,
        gc.source,
        gc.chapter,
        gc.content,
        1.0 - (gc.embedding <=> query_embedding) AS similarity
    FROM public.guideline_chunks gc
    WHERE 1.0 - (gc.embedding <=> query_embedding) > match_threshold
    ORDER BY gc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create the sms_failures table to capture webhook failures for manual auditing
CREATE TABLE public.sms_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    error_message TEXT,
    attempts INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for manual review queries
CREATE INDEX sms_failures_created_at_idx ON public.sms_failures(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.guideline_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_failures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guideline_chunks
CREATE POLICY select_guidelines_policy ON public.guideline_chunks
    FOR SELECT TO authenticated USING (true);

CREATE POLICY service_guidelines_policy ON public.guideline_chunks
    FOR ALL TO service_role USING (true);

-- RLS Policies for sms_failures
CREATE POLICY service_sms_failures_policy ON public.sms_failures
    FOR ALL TO service_role USING (true);
