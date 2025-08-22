-- Migration to add offer field to missions table
-- This migration adds the offer field to describe what the mission actually gives

-- Add offer column to missions table
ALTER TABLE "missions" 
ADD COLUMN "offer" TEXT NOT NULL DEFAULT 'Special reward for completing this mission';

-- Add comment to clarify the offer field
COMMENT ON COLUMN "missions"."offer" IS 'Description of what the mission offers (e.g., cashback, discount, free item)';

-- Update existing missions to have a default offer
UPDATE "missions" 
SET "offer" = 'Special reward for completing this mission' 
WHERE "offer" IS NULL OR "offer" = '';