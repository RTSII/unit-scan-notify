BEGIN;

-- 1. Remove any violation_photos rows without a matching violation_forms parent
DELETE FROM public.violation_photos vp
WHERE NOT EXISTS (
  SELECT 1 FROM public.violation_forms vf WHERE vf.id = vp.violation_id
);

-- 2. Replace the existing foreign key (if any) so it references violation_forms with ON DELETE CASCADE
ALTER TABLE public.violation_photos
DROP CONSTRAINT IF EXISTS violation_photos_violation_id_fkey;

ALTER TABLE public.violation_photos
ADD CONSTRAINT violation_photos_violation_id_fkey
FOREIGN KEY (violation_id)
REFERENCES public.violation_forms(id)
ON DELETE CASCADE;

-- 3. Refresh RLS policies to reference violation_forms instead of violation_forms_new
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'violation_photos'
      AND policyname IN (
        'Photo INSERT by uploader',
        'Photo SELECT uploader_or_reporter',
        'Photo UPDATE uploader_only',
        'Photo DELETE uploader_or_reporter'
      )
  ) THEN
    DROP POLICY IF EXISTS "Photo INSERT by uploader" ON public.violation_photos;
    DROP POLICY IF EXISTS "Photo SELECT uploader_or_reporter" ON public.violation_photos;
    DROP POLICY IF EXISTS "Photo UPDATE uploader_only" ON public.violation_photos;
    DROP POLICY IF EXISTS "Photo DELETE uploader_or_reporter" ON public.violation_photos;
  END IF;
END $$;

CREATE POLICY "Photo INSERT by uploader"
ON public.violation_photos
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = uploaded_by);

CREATE POLICY "Photo SELECT team_read"
ON public.violation_photos
FOR SELECT
TO authenticated
USING (
  uploaded_by = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.violation_forms vf
    WHERE vf.id = violation_photos.violation_id
  )
);

CREATE POLICY "Photo UPDATE uploader_only"
ON public.violation_photos
FOR UPDATE
TO authenticated
USING (uploaded_by = (SELECT auth.uid()))
WITH CHECK (uploaded_by = (SELECT auth.uid()));

CREATE POLICY "Photo DELETE uploader_or_admin"
ON public.violation_photos
FOR DELETE
TO authenticated
USING (
  uploaded_by = (SELECT auth.uid())
  OR get_current_user_role() = 'admin'
);

-- 4. Ensure violation_forms SELECT policy allows team-wide reads while preserving admin controls
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'violation_forms'
      AND policyname = 'Users can view own violation forms, admins view all'
  ) THEN
    DROP POLICY "Users can view own violation forms, admins view all" ON public.violation_forms;
  END IF;
END $$;

CREATE POLICY "Team members can view violation forms"
ON public.violation_forms
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

COMMIT;
