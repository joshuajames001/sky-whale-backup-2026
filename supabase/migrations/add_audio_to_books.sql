-- Add audio_url column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add comment
COMMENT ON COLUMN books.audio_url IS 'URL to the generated audio narration (MP3)';

-- Create storage bucket for audio books if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-books', 'audio-books', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public to read audio files
CREATE POLICY "Public Audio Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'audio-books' );

-- Policy: Allow authenticated users to upload their own audio (or rely on Edge Function with Service Role)
-- We will rely on Edge Function, so no INSERT policy needed for now specific to users.
