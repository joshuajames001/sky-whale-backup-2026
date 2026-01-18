-- Add trailer_url column to discovery_categories
ALTER TABLE discovery_categories 
ADD COLUMN trailer_url text;

-- Optional: Add comment
COMMENT ON COLUMN discovery_categories.trailer_url IS 'URL for the category intro video (e.g. /discovery/dino_intro.mp4)';
