
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.universities_catalog (
  id text PRIMARY KEY,
  name text NOT NULL,
  country text NOT NULL,
  region text,
  website text,
  domains text[] DEFAULT '{}',
  state_province text,
  qs_rank integer,
  has_curated_data boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.universities_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read universities catalog"
ON public.universities_catalog FOR SELECT
USING (true);

CREATE INDEX idx_uni_catalog_country ON public.universities_catalog(country);
CREATE INDEX idx_uni_catalog_region ON public.universities_catalog(region);
CREATE INDEX idx_uni_catalog_name_trgm ON public.universities_catalog USING gin (name gin_trgm_ops);
