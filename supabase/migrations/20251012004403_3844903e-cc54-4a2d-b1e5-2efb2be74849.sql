-- Add foreign key constraint from violation_photos to violation_forms
ALTER TABLE public.violation_photos
ADD CONSTRAINT violation_photos_violation_id_fkey 
FOREIGN KEY (violation_id) 
REFERENCES public.violation_forms(id) 
ON DELETE CASCADE;