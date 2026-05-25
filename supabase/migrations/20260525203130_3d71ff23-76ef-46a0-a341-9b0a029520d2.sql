-- 1) evaluations: require authenticated user, no anonymous null user_id inserts
DROP POLICY IF EXISTS "Anyone can create evaluation" ON public.evaluations;

CREATE POLICY "Authenticated users create own evaluation"
ON public.evaluations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 2) university_tips: explicit UPDATE policy locked to own un-approved rows,
-- and prevent self-approval/verification
CREATE POLICY "Users update own pending tips"
ON public.university_tips
FOR UPDATE
TO authenticated
USING (submitted_by = auth.uid() AND approved = false)
WITH CHECK (
  submitted_by = auth.uid()
  AND approved = false
  AND verified = false
);
