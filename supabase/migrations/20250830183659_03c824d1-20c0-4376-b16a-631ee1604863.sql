-- Phase 1: Fix Critical PII Exposure in invites table
-- Remove the vulnerable policy that exposes emails publicly
DROP POLICY IF EXISTS "Anyone can view valid invites by token" ON public.invites;

-- Create a secure function to validate invite tokens without exposing emails
CREATE OR REPLACE FUNCTION public.validate_invite_token(token_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.invites 
    WHERE token = token_input 
    AND used_at IS NULL 
    AND expires_at > now()
  );
END;
$$;

-- Create a secure function to get invite details by token (for registration)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(token_input text)
RETURNS TABLE(id uuid, email text, invited_by uuid, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.email, i.invited_by, i.expires_at
  FROM public.invites i
  WHERE i.token = token_input 
  AND i.used_at IS NULL 
  AND i.expires_at > now();
END;
$$;

-- Phase 2: Fix RLS Infinite Recursion in profiles table
-- Remove the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create security definer function to safely check user roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create new safe admin policy using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Add policy to allow profile creation during user registration
CREATE POLICY "Allow profile creation during registration" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);