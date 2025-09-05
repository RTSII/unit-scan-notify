-- Ensure rob@ursllc.com has a profile with admin role
DO $$
DECLARE
    rob_user_id uuid;
BEGIN
    -- Get the user ID for rob@ursllc.com
    SELECT id INTO rob_user_id 
    FROM auth.users 
    WHERE email = 'rob@ursllc.com';
    
    IF rob_user_id IS NOT NULL THEN
        -- Insert or update the profile
        INSERT INTO public.profiles (user_id, email, role, full_name, created_at, updated_at)
        VALUES (
            rob_user_id,
            'rob@ursllc.com',
            'admin',
            'Rob',
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'admin',
            email = 'rob@ursllc.com',
            updated_at = NOW();
            
        RAISE NOTICE 'Profile created/updated for rob@ursllc.com with admin role';
    ELSE
        RAISE NOTICE 'User rob@ursllc.com not found in auth.users';
    END IF;
END $$;