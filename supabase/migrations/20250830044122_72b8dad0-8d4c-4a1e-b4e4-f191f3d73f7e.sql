-- Fix security warnings by setting proper search_path for functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
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
      WHEN NEW.email = 'your-admin-email@domain.com' THEN 'admin'
      ELSE 'user'
    END
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_invite(invite_email TEXT)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
DECLARE
  invite_id UUID;
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
  RETURNING id INTO invite_id;
  
  RETURN invite_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;