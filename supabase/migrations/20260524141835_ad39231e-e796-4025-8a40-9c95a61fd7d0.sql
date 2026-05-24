-- Dedupe universities by name+country (keep oldest non-curated row)
DELETE FROM public.universities_catalog a
USING public.universities_catalog b
WHERE a.ctid > b.ctid
  AND lower(a.name) = lower(b.name)
  AND lower(a.country) = lower(b.country)
  AND a.has_curated_data = false;

-- Add unique constraint so future imports can ON CONFLICT cleanly
CREATE UNIQUE INDEX IF NOT EXISTS universities_catalog_name_country_uniq
  ON public.universities_catalog (lower(name), lower(country));