
-- Add slug column for stable detail URLs
ALTER TABLE public.scholarships
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS funding_type text,
  ADD COLUMN IF NOT EXISTS provider_type text,
  ADD COLUMN IF NOT EXISTS cycle_status text DEFAULT 'active_open',
  ADD COLUMN IF NOT EXISTS application_fee_usd integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upfront_costs_covered jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hidden_obligations text,
  ADD COLUMN IF NOT EXISTS allowance_breakdown jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hidden_costs_for_student text,
  ADD COLUMN IF NOT EXISTS accepts_moi_waiver boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS academic_profile_weight text,
  ADD COLUMN IF NOT EXISTS expected_next_open_month text,
  ADD COLUMN IF NOT EXISTS required_documents_checklist text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS insider_tips jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hydrated_at timestamp with time zone;

-- Add validation constraints (via trigger to remain mutable; CHECK is fine since values are static)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scholarships_funding_type_chk') THEN
    ALTER TABLE public.scholarships
      ADD CONSTRAINT scholarships_funding_type_chk
      CHECK (funding_type IS NULL OR funding_type IN ('fully_funded','tuition_waiver','partial_bursary','stipend_only'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scholarships_provider_type_chk') THEN
    ALTER TABLE public.scholarships
      ADD CONSTRAINT scholarships_provider_type_chk
      CHECK (provider_type IS NULL OR provider_type IN ('government','university_internal','private_corporate','ngo_foundation'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scholarships_cycle_status_chk') THEN
    ALTER TABLE public.scholarships
      ADD CONSTRAINT scholarships_cycle_status_chk
      CHECK (cycle_status IS NULL OR cycle_status IN ('active_open','closed_prep_mode','rolling_admissions'));
  END IF;
END $$;

-- Backfill slug from name (lowercase, dash-separated)
UPDATE public.scholarships
SET slug = regexp_replace(
  lower(trim(both '-' from regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))),
  '-+', '-', 'g'
)
WHERE slug IS NULL;

-- Ensure uniqueness once backfilled
CREATE UNIQUE INDEX IF NOT EXISTS scholarships_slug_uniq ON public.scholarships (slug);
CREATE INDEX IF NOT EXISTS scholarships_cycle_status_idx ON public.scholarships (cycle_status);
CREATE INDEX IF NOT EXISTS scholarships_funding_type_idx ON public.scholarships (funding_type);
