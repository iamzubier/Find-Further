
CREATE TABLE IF NOT EXISTS public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  host_country text,
  degree_level text,
  annual_value_usd numeric,
  amount_display text,
  deadline date,
  official_url text,
  eligible_countries text[] DEFAULT '{}'::text[],
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS scholarships_name_country_uidx
  ON public.scholarships (lower(name), lower(coalesce(host_country, '')));

ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read scholarships" ON public.scholarships;
CREATE POLICY "Anyone can read scholarships"
  ON public.scholarships FOR SELECT
  USING (true);

DROP TRIGGER IF EXISTS scholarships_touch_updated_at ON public.scholarships;
CREATE TRIGGER scholarships_touch_updated_at
  BEFORE UPDATE ON public.scholarships
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
