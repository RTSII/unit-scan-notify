-- Create storage bucket for violation photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('violation-photos', 'violation-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Create policy for users to upload their own violation photos
CREATE POLICY "Users can upload violation photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'violation-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to view their own violation photos
CREATE POLICY "Users can view their own violation photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'violation-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to delete their own violation photos
CREATE POLICY "Users can delete their own violation photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'violation-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);