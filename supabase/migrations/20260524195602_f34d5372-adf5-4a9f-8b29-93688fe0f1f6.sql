DROP POLICY IF EXISTS "Authenticated users can view evaluations" ON public.evaluations;

CREATE POLICY "Users can view own evaluation"
ON public.evaluations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());