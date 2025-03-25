-- Create a storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Set up storage policy to allow authenticated users to upload their own avatars
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Set up storage policy to allow public access to avatars
CREATE POLICY "Allow public access to avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars'); 