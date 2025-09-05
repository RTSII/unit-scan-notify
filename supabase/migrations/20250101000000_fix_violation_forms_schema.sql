-- Fix violation_forms table schema to match application data format
-- This migration addresses date/time format mismatches and nullable fields

-- 1. Change date column from DATE to TEXT to handle MM/DD format
ALTER TABLE public.violation_forms 
ALTER COLUMN date TYPE TEXT;

-- 2. Change time column from TIME to TEXT to handle HH:MM AM/PM format  
ALTER TABLE public.violation_forms 
ALTER COLUMN time TYPE TEXT;

-- 3. Make description nullable since it can be empty
ALTER TABLE public.violation_forms 
ALTER COLUMN description DROP NOT NULL;

-- 4. Make time nullable since it can be empty in DetailsPrevious
ALTER TABLE public.violation_forms 
ALTER COLUMN time DROP NOT NULL;

-- 5. Add default empty string for description to maintain consistency
ALTER TABLE public.violation_forms 
ALTER COLUMN description SET DEFAULT '';

-- 6. Add default empty string for time to maintain consistency  
ALTER TABLE public.violation_forms 
ALTER COLUMN time SET DEFAULT '';

-- 7. Update existing records to ensure no NULL values
UPDATE public.violation_forms 
SET description = '' 
WHERE description IS NULL;

UPDATE public.violation_forms 
SET time = '' 
WHERE time IS NULL;