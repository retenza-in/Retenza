-- Migration to add logo_url field and remove email and operating_hours
-- Remove email and operating_hours columns
ALTER TABLE businesses 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS operating_hours;

-- Add logo_url column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500); 