-- Create storage bucket for menu PDFs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-pdfs', 'menu-pdfs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to menu PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin upload to menu PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin update menu PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete menu PDFs" ON storage.objects;

-- Allow anyone to read menu PDFs (public bucket)
CREATE POLICY "Allow public read access to menu PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-pdfs');

-- Allow admins to upload menu PDFs
CREATE POLICY "Allow admin upload to menu PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-pdfs' 
  AND auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- Allow admins to update menu PDFs
CREATE POLICY "Allow admin update menu PDFs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-pdfs' 
  AND auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- Allow admins to delete menu PDFs
CREATE POLICY "Allow admin delete menu PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-pdfs' 
  AND auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);
