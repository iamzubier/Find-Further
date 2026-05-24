
CREATE TABLE public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  home_country text NOT NULL,
  curriculum_type text NOT NULL,
  grades_raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  grades_converted jsonb NOT NULL DEFAULT '{}'::jsonb,
  test_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_countries text[] NOT NULL DEFAULT '{}'::text[],
  intended_major text,
  intake text,
  budget text,
  scholarship_need text,
  eca_text text,
  profile_score integer NOT NULL DEFAULT 0,
  score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_evaluated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Logged-in users can read any evaluation by id (shareable to authenticated viewers)
CREATE POLICY "Authenticated users can view evaluations"
ON public.evaluations FOR SELECT
TO authenticated
USING (true);

-- Anyone can insert their own (or anonymous) evaluation; anonymous rows have user_id NULL
CREATE POLICY "Anyone can create evaluation"
ON public.evaluations FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can update own evaluation"
ON public.evaluations FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own evaluation"
ON public.evaluations FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE INDEX idx_evaluations_user ON public.evaluations(user_id);
