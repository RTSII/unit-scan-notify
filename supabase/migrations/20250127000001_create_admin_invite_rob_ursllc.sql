-- Create initial admin invite for rob@ursllc.com
-- This ensures the admin can register even though the system requires invites

INSERT INTO public.invites (email, expires_at) 
VALUES ('rob@ursllc.com', NOW() + INTERVAL '30 days')
ON CONFLICT (email) DO NOTHING;