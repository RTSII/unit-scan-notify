-- Update invites table to generate 5-character alphanumeric tokens
-- First, drop the existing default
ALTER TABLE public.invites 
ALTER COLUMN token DROP DEFAULT;

-- Create a function to generate 5-character alphanumeric tokens
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed ambiguous chars like 0, O, 1, I
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Set the new default using the function
ALTER TABLE public.invites 
ALTER COLUMN token SET DEFAULT generate_invite_token();

-- Drop and recreate the create_invite function to return the token
DROP FUNCTION IF EXISTS public.create_invite(text);

CREATE FUNCTION public.create_invite(invite_email text)
RETURNS TABLE(invite_id uuid, invite_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  new_invite_id UUID;
  new_token text;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create invites';
  END IF;
  
  -- Create invite
  INSERT INTO public.invites (email, invited_by)
  VALUES (invite_email, auth.uid())
  RETURNING id, token INTO new_invite_id, new_token;
  
  RETURN QUERY SELECT new_invite_id, new_token;
END;
$$;