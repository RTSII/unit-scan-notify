-- Phase 1: Fix Critical RLS Issues

-- Enable RLS on analytics tables
ALTER TABLE public.team_performance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_team_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team_performance_summary (admin-only access)
CREATE POLICY "Only admins can view team performance summary"
ON public.team_performance_summary
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin');

-- Create RLS policies for user_activity_summary
CREATE POLICY "Admins can view all user activity"
ON public.user_activity_summary
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin');

CREATE POLICY "Users can view their own activity summary"
ON public.user_activity_summary
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create RLS policies for recent_team_activity
CREATE POLICY "Admins can view all recent team activity"
ON public.recent_team_activity
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin');

CREATE POLICY "Users can view their own recent activity"
ON public.recent_team_activity
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Strengthen invite system security
-- Update handle_new_user function to remove hardcoded admin email and add better validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  invite_record RECORD;
BEGIN
  -- For email signups, verify invite exists and is valid
  IF NEW.email IS NOT NULL THEN
    SELECT * INTO invite_record
    FROM public.invites 
    WHERE email = NEW.email 
    AND used_at IS NULL 
    AND expires_at > now()
    LIMIT 1;
    
    -- Require valid invite for all new registrations
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Registration requires a valid invite for email: %', NEW.email;
    END IF;
    
    -- Mark invite as used atomically
    UPDATE public.invites 
    SET used_at = now() 
    WHERE id = invite_record.id;
  ELSE
    RAISE EXCEPTION 'Email is required for registration';
  END IF;

  -- Create profile with role determination
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    -- Role is determined by the invite, default to 'user'
    COALESCE(invite_record.role, 'user')
  );
  
  RETURN NEW;
END;
$function$;

-- Add role column to invites table to allow role-based invitations
ALTER TABLE public.invites 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Update create_invite function to support role specification
CREATE OR REPLACE FUNCTION public.create_invite(invite_email text, invite_role text DEFAULT 'user')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
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
  
  -- Validate role parameter
  IF invite_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role specified. Must be admin or user';
  END IF;
  
  -- Create invite with role
  INSERT INTO public.invites (email, invited_by, role)
  VALUES (invite_email, auth.uid(), invite_role)
  RETURNING id INTO invite_id;
  
  RETURN invite_id;
END;
$function$;

-- Add audit logging for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid,
  email text,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin');