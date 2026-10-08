DROP POLICY IF EXISTS "Anyone can read scholarship success stories" ON public.scholarship_success_stories;
REVOKE SELECT ON public.scholarship_success_stories FROM anon;
GRANT SELECT ON public.scholarship_success_stories TO authenticated;
CREATE POLICY "Signed-in users can read scholarship success stories" ON public.scholarship_success_stories FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);