-- Add is_hidden flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_hidden BOOLEAN DEFAULT false;

-- Set Cynthia's profile as hidden
UPDATE public.profiles 
SET is_hidden = true 
WHERE email = 'missourirn@aol.com';

-- Update RLS policies to respect hidden status
-- Drop and recreate the admin view policy to include hidden users
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles including hidden"
ON public.profiles
FOR SELECT
USING (get_current_user_role() = 'admin');

-- Update user self-view policy (no change needed, users see their own profile)
-- Hidden users can still see themselves
