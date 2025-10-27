-- Make violation-photos bucket public so photos can be displayed
-- RLS policies still control who can upload/delete, but viewing is allowed via public URLs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'violation-photos';