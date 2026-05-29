-- Create docs_config table for MaSheba AI documentation access control
create table if not exists public.docs_config (
  id integer primary key default 1 check (id = 1),
  is_public boolean not null default true,
  start_at timestamptz not null default '2026-06-10 00:00:00+06',
  end_at timestamptz not null default '2026-06-14 23:59:59+06',
  youtube_url text not null default 'https://www.youtube.com/embed/demo',
  team_members jsonb not null default '[
    {"name": "Mihir Das", "role": "UI/UX Design", "email": "mihir@example.com", "initials": "MD"},
    {"name": "Mehedi Hasan Nafis", "role": "Backend Engineering", "email": "nafismehedi37@gmail.com", "initials": "MN", "avatar_url": "/nafis.jpg"},
    {"name": "Fayaz Bin Faruk", "role": "Data Science / Business Analytics", "email": "fayazcr79@gmail.com", "initials": "FF", "avatar_url": "/fayaz.png"},
    {"name": "Hasnain Ashraf", "role": "Presentation & Communication", "email": "hasnainashraf003@gmail.com", "initials": "HA", "avatar_url": "/hasnain.jpg"},
    {"name": "Digonta Das", "role": "Project Manager", "email": "digontadas0171@gmail.com", "initials": "DD", "avatar_url": "/digonta.jpg"}
  ]'::jsonb,
  feature_matrix jsonb not null default '[
    {"feature": "Offline risk assessment", "status": "Live", "notes": "On-device intake and risk badge for CHW visits."},
    {"feature": "ONNX model", "status": "Live", "notes": "XGBoost model packaged for low-end Android inference."},
    {"feature": "Outbox sync", "status": "Live", "notes": "SQLite WAL queue retries events when connectivity returns."},
    {"feature": "Bangla AI chat", "status": "Live", "notes": "Groq-first LLM cascade with Gemini fallback and local safety checks."},
    {"feature": "Offline Q&A", "status": "Live", "notes": "Seeded maternal health answers available without network."},
    {"feature": "Medicine verify", "status": "Live", "notes": "Offline medicine and dosage guidance workflow."},
    {"feature": "FCM push", "status": "Live", "notes": "Push alerts for care reminders and admin broadcasts."},
    {"feature": "Admin dashboard", "status": "Live", "notes": "Next.js dashboard with Supabase analytics views."},
    {"feature": "Full RAG pipeline", "status": "Planned", "notes": "WHO and DGHS guideline chunks embedded in pgvector."},
    {"feature": "Whisper voice input", "status": "Planned", "notes": "Bangla voice capture for hands-free CHW intake."},
    {"feature": "Coqui TTS", "status": "Planned", "notes": "Audio guidance for low-literacy mother journeys."},
    {"feature": "SMS/IVR alerts", "status": "Planned", "notes": "Fallback alerts for households without data connectivity."},
    {"feature": "Geographic heat maps", "status": "Planned", "notes": "Upazila-level risk and compliance visualization."},
    {"feature": "On-device LLM", "status": "Planned", "notes": "Fine-tuned Llama 3.1 8B in GGUF 4-bit format."}
  ]'::jsonb,
  draft_config jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.docs_config
  add column if not exists feature_matrix jsonb not null default '[
    {"feature": "Offline risk assessment", "status": "Live", "notes": "On-device intake and risk badge for CHW visits."},
    {"feature": "ONNX model", "status": "Live", "notes": "XGBoost model packaged for low-end Android inference."},
    {"feature": "Outbox sync", "status": "Live", "notes": "SQLite WAL queue retries events when connectivity returns."},
    {"feature": "Bangla AI chat", "status": "Live", "notes": "Groq-first LLM cascade with Gemini fallback and local safety checks."},
    {"feature": "Offline Q&A", "status": "Live", "notes": "Seeded maternal health answers available without network."},
    {"feature": "Medicine verify", "status": "Live", "notes": "Offline medicine and dosage guidance workflow."},
    {"feature": "FCM push", "status": "Live", "notes": "Push alerts for care reminders and admin broadcasts."},
    {"feature": "Admin dashboard", "status": "Live", "notes": "Next.js dashboard with Supabase analytics views."},
    {"feature": "Full RAG pipeline", "status": "Planned", "notes": "WHO and DGHS guideline chunks embedded in pgvector."},
    {"feature": "Whisper voice input", "status": "Planned", "notes": "Bangla voice capture for hands-free CHW intake."},
    {"feature": "Coqui TTS", "status": "Planned", "notes": "Audio guidance for low-literacy mother journeys."},
    {"feature": "SMS/IVR alerts", "status": "Planned", "notes": "Fallback alerts for households without data connectivity."},
    {"feature": "Geographic heat maps", "status": "Planned", "notes": "Upazila-level risk and compliance visualization."},
    {"feature": "On-device LLM", "status": "Planned", "notes": "Fine-tuned Llama 3.1 8B in GGUF 4-bit format."}
  ]'::jsonb,
  add column if not exists draft_config jsonb;

-- Seed initial row
insert into public.docs_config (id, is_public, start_at, end_at, youtube_url)
values (1, true, '2026-06-10 00:00:00+06', '2026-06-14 23:59:59+06', 'https://www.youtube.com/embed/demo')
on conflict (id) do nothing;

-- Enable RLS
alter table public.docs_config enable row level security;

-- Drop policies if exist
drop policy if exists "Allow public read access to docs_config" on public.docs_config;
drop policy if exists "Allow admin write access to docs_config" on public.docs_config;

-- Create policies
create policy "Allow public read access to docs_config"
on public.docs_config
for select
to public
using (true);
