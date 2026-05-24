
-- Rich detail per university (slug = url)
CREATE TABLE public.universities_detail (
  slug text PRIMARY KEY,
  catalog_id text,
  name text NOT NULL,
  country text NOT NULL,
  country_flag text,
  city text,
  qs_rank integer,
  founded_year integer,
  acceptance_rate text,
  total_students text,
  international_pct text,
  student_faculty_ratio text,
  about text,
  campus_life text,
  notable_alumni text[] DEFAULT '{}',
  subject_rankings jsonb DEFAULT '[]'::jsonb,
  logo_url text,
  campus_image_url text,
  official_url text,
  application_url text,
  maps_query text,
  admission_reqs jsonb DEFAULT '{}'::jsonb,
  deadlines jsonb DEFAULT '[]'::jsonb,
  application_steps text[] DEFAULT '{}',
  required_docs text[] DEFAULT '{}',
  processing_time text,
  tuition jsonb DEFAULT '{}'::jsonb,
  living_cost_monthly integer,
  fee_waivers text,
  scholarships jsonb DEFAULT '[]'::jsonb,
  financial_aid text,
  work_permit text,
  programs_detail jsonb DEFAULT '[]'::jsonb,
  exams jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.universities_detail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read university details"
  ON public.universities_detail FOR SELECT
  USING (true);

CREATE TRIGGER trg_universities_detail_updated
  BEFORE UPDATE ON public.universities_detail
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Community tips
CREATE TABLE public.university_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uni_slug text NOT NULL REFERENCES public.universities_detail(slug) ON DELETE CASCADE,
  tip_text text NOT NULL,
  source_platform text NOT NULL CHECK (source_platform IN ('reddit','quora','youtube','forum','official')),
  source_url text,
  source_upvotes integer DEFAULT 0,
  tag text NOT NULL CHECK (tag IN ('Academics','ECA','Scholarship','Strategy','CampusLife','FinancialAid')),
  posted_at date,
  verified boolean NOT NULL DEFAULT false,
  submitted_by uuid,
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_university_tips_slug ON public.university_tips(uni_slug);

ALTER TABLE public.university_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved tips"
  ON public.university_tips FOR SELECT
  USING (approved = true);

CREATE POLICY "Authenticated users submit tips"
  ON public.university_tips FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid() AND approved = false);
