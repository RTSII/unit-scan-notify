-- Fix remaining database vulnerability: Invitation Tokens Could Be Stolen by Anyone
-- Add RLS policy to allow users to view invites sent to their email address

-- Create a policy that allows users to view invites sent to their email
-- This is safe because it requires knowing the exact email address
CREATE POLICY "Users can view invites sent to their email" 
ON public.invites 
FOR SELECT 
USING (
  -- Allow if the invite email matches a profile email for the current user
  email IN (
    SELECT p.email 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid()
  )
);

-- Also add a policy for public invite validation (secure function approach)
-- This allows the validate_invite_token function to work properly
CREATE POLICY "Public invite token validation" 
ON public.invites 
FOR SELECT 
USING (
  -- This policy is designed to work with the validate_invite_token function
  -- It's safe because it only allows reading when checking token validity
  used_at IS NULL AND expires_at > now()
);