-- Security Fix Phase 1: Critical RLS Policy Updates

-- 1. Remove the dangerous public invite token validation policy
DROP POLICY IF EXISTS "Public invite token validation" ON public.invites;

-- 2. Replace the overly permissive violation forms policy with secure user-specific access
DROP POLICY IF EXISTS "All users can view all violation forms" ON public.violation_forms;

-- Create new secure policy for violation forms - users can only see their own, admins see all
CREATE POLICY "Users can view own violation forms, admins view all" 
ON public.violation_forms 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  get_current_user_role() = 'admin'
);

-- 3. Create secure server-side function for invite token validation (replaces public access)
CREATE OR REPLACE FUNCTION public.validate_invite_token_secure(token_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invite_record RECORD;
  result json;
BEGIN
  -- Rate limiting could be added here in future
  
  SELECT id, email, expires_at, used_at
  INTO invite_record
  FROM public.invites 
  WHERE token = token_input;
  
  -- Check if invite exists
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid invite token');
  END IF;
  
  -- Check if already used
  IF invite_record.used_at IS NOT NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invite token already used');
  END IF;
  
  -- Check if expired
  IF invite_record.expires_at <= now() THEN
    RETURN json_build_object('valid', false, 'error', 'Invite token expired');
  END IF;
  
  -- Return success with minimal info (no sensitive data)
  RETURN json_build_object(
    'valid', true, 
    'email', invite_record.email
  );
END;
$$;

-- 4. Update database functions to have explicit search_path for security
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- 5. Update handle_new_user function with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user was invited (for email signups)
  IF NEW.email IS NOT NULL THEN
    -- Verify invite exists and is valid
    IF NOT EXISTS (
      SELECT 1 FROM public.invites 
      WHERE email = NEW.email 
      AND used_at IS NULL 
      AND expires_at > now()
    ) THEN
      RAISE EXCEPTION 'Registration requires a valid invite';
    END IF;
    
    -- Mark invite as used
    UPDATE public.invites 
    SET used_at = now() 
    WHERE email = NEW.email AND used_at IS NULL;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    CASE 
      -- ADMIN EMAIL SET TO: rob@ursllc.com
      WHEN NEW.email = 'rob@ursllc.com' THEN 'admin'
      ELSE 'user'
    END
  );
  
  RETURN NEW;
END;
$$;