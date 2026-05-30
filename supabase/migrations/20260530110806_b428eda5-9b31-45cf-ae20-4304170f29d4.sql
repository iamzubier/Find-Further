CREATE OR REPLACE FUNCTION public._jsonb_to_text_array(j jsonb) RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN j IS NULL OR jsonb_typeof(j) <> 'array' THEN '{}'::text[]
    ELSE ARRAY(SELECT jsonb_array_elements_text(j)) END
$$;