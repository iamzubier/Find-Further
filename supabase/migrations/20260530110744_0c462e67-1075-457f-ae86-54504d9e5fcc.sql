CREATE OR REPLACE FUNCTION public._jsonb_to_text_array(j jsonb) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN j IS NULL OR jsonb_typeof(j) <> 'array' THEN '{}'::text[]
    ELSE ARRAY(SELECT jsonb_array_elements_text(j)) END
$$;

ALTER TABLE public.scholarships
  ALTER COLUMN application_steps DROP DEFAULT,
  ALTER COLUMN application_steps TYPE text[] USING public._jsonb_to_text_array(application_steps),
  ALTER COLUMN application_steps SET DEFAULT '{}'::text[];

ALTER TABLE public.scholarships
  ALTER COLUMN required_docs DROP DEFAULT,
  ALTER COLUMN required_docs TYPE text[] USING public._jsonb_to_text_array(required_docs),
  ALTER COLUMN required_docs SET DEFAULT '{}'::text[];