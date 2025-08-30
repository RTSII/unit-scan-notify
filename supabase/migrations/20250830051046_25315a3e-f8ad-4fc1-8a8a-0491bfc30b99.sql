-- Update the admin email in the trigger function
-- Replace 'your-admin-email@domain.com' with your actual admin email address

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
      -- CHANGE THIS EMAIL TO YOUR ADMIN EMAIL:
      WHEN NEW.email = 'admin@yourdomain.com' THEN 'admin'
      ELSE 'user'
    END
  );
  
  RETURN NEW;
END;
$$;