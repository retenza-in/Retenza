-- Add missing business profile fields
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS gmap_link VARCHAR(500),
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS additional_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Update existing records to set contact_number from phone_number if it's null
UPDATE businesses 
SET contact_number = phone_number 
WHERE contact_number IS NULL;

-- Make contact_number not null after setting default values
ALTER TABLE businesses 
ALTER COLUMN contact_number SET NOT NULL;

-- For existing businesses, set user_id to id (temporary fix - you may want to update this based on your auth system)
UPDATE businesses 
SET user_id = id 
WHERE user_id IS NULL;

-- Make user_id not null after setting default values
ALTER TABLE businesses 
ALTER COLUMN user_id SET NOT NULL; 