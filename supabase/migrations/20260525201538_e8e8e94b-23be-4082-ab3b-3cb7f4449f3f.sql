
-- 1. Extend scholarships
ALTER TABLE public.scholarships
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS next_cycle text,
  ADD COLUMN IF NOT EXISTS fully_funded boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS covers_tuition boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS covers_living boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS covers_airfare boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS covers_insurance boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS monthly_stipend_usd integer,
  ADD COLUMN IF NOT EXISTS seats_per_year integer,
  ADD COLUMN IF NOT EXISTS acceptance_rate text,
  ADD COLUMN IF NOT EXISTS avg_gpa_recipients text,
  ADD COLUMN IF NOT EXISTS avg_ielts_recipients text,
  ADD COLUMN IF NOT EXISTS competitiveness text,
  ADD COLUMN IF NOT EXISTS bond_requirement text,
  ADD COLUMN IF NOT EXISTS renewable boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS renewal_conditions text,
  ADD COLUMN IF NOT EXISTS work_permit boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS age_limit integer,
  ADD COLUMN IF NOT EXISTS required_docs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS application_steps jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS results_announced text,
  ADD COLUMN IF NOT EXISTS official_apply_url text,
  ADD COLUMN IF NOT EXISTS banner_image_url text,
  ADD COLUMN IF NOT EXISTS flag_emoji text,
  ADD COLUMN IF NOT EXISTS subject_restrictions text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS universities_covered text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS wow_fact text;

CREATE UNIQUE INDEX IF NOT EXISTS scholarships_slug_uniq ON public.scholarships(slug);
CREATE INDEX IF NOT EXISTS scholarships_status_idx ON public.scholarships(status);

-- 2. scholarship_tips
CREATE TABLE IF NOT EXISTS public.scholarship_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid REFERENCES public.scholarships(id) ON DELETE CASCADE,
  scholarship_slug text NOT NULL,
  tip_text text NOT NULL,
  source_platform text,
  source_url text,
  source_upvotes integer DEFAULT 0,
  tag text,
  applicant_country text,
  year_posted integer,
  helpful_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scholarship_tips_slug_idx ON public.scholarship_tips(scholarship_slug);
ALTER TABLE public.scholarship_tips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read scholarship tips" ON public.scholarship_tips;
CREATE POLICY "Anyone can read scholarship tips" ON public.scholarship_tips FOR SELECT USING (true);

-- 3. scholarship_success_stories
CREATE TABLE IF NOT EXISTS public.scholarship_success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid REFERENCES public.scholarships(id) ON DELETE CASCADE,
  scholarship_slug text NOT NULL,
  applicant_country text,
  curriculum text,
  gpa_raw text,
  ielts_score text,
  major text,
  eca_summary text,
  year_awarded integer,
  story text,
  tips_from_winner text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scholarship_success_stories_slug_idx ON public.scholarship_success_stories(scholarship_slug);
ALTER TABLE public.scholarship_success_stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read scholarship success stories" ON public.scholarship_success_stories;
CREATE POLICY "Anyone can read scholarship success stories" ON public.scholarship_success_stories FOR SELECT USING (true);
