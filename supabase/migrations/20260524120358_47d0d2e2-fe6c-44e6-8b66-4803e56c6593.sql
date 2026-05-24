
CREATE TABLE public.university_hacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uni_id text NOT NULL,
  hack_text text NOT NULL,
  source_url text,
  source_type text NOT NULL DEFAULT 'official',
  upvotes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_university_hacks_uni ON public.university_hacks(uni_id);
ALTER TABLE public.university_hacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hacks" ON public.university_hacks FOR SELECT USING (true);

CREATE TABLE public.university_hacks_ai (
  uni_id text PRIMARY KEY,
  content_md text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.university_hacks_ai ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read AI hacks" ON public.university_hacks_ai FOR SELECT USING (true);
