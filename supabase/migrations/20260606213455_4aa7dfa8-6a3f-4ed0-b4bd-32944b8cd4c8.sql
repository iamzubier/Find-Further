
ALTER TABLE public.scholarships
  ADD COLUMN IF NOT EXISTS min_sat_score integer,
  ADD COLUMN IF NOT EXISTS min_act_score integer,
  ADD COLUMN IF NOT EXISTS awarding_basis text;

CREATE INDEX IF NOT EXISTS scholarships_min_sat_idx ON public.scholarships (min_sat_score);
CREATE INDEX IF NOT EXISTS scholarships_awarding_basis_idx ON public.scholarships (awarding_basis);

-- Backfill awarding_basis from the free-text academic_profile_weight values
UPDATE public.scholarships SET awarding_basis = CASE
  WHEN academic_profile_weight ILIKE '%work exp%' OR academic_profile_weight ILIKE '%professional%' OR academic_profile_weight ILIKE '%years of work%' OR academic_profile_weight ILIKE '%3,000%' OR academic_profile_weight ILIKE '%development work%' THEN 'professional'
  WHEN academic_profile_weight ILIKE '%portfolio%' OR academic_profile_weight ILIKE '%creative%' OR academic_profile_weight ILIKE '%design portfolio%' OR academic_profile_weight ILIKE '%ECA%' OR academic_profile_weight ILIKE '%leadership%' OR academic_profile_weight ILIKE '%civic%' OR academic_profile_weight ILIKE '%community%' OR academic_profile_weight ILIKE '%social%' OR academic_profile_weight ILIKE '%volunteer%' OR academic_profile_weight ILIKE '%engagement%' THEN 'portfolio'
  ELSE 'merit'
END
WHERE awarding_basis IS NULL;
