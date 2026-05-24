ALTER TABLE public.universities_catalog ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.universities_catalog uc
SET slug = ud.slug, has_curated_data = true
FROM public.universities_detail ud
WHERE lower(uc.name) = lower(ud.name);

CREATE INDEX IF NOT EXISTS idx_universities_catalog_slug ON public.universities_catalog(slug);