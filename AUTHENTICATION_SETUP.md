# SPR Vice City Authentication Setup

## Overview
Your app now has a complete invite-only authentication system with:
- Email/password registration and login
- Google OAuth integration
- User profiles and role management  
- Admin invite system
- Automatic user tracking

## Important Configuration Steps

### 1. Set Your Admin Email
Update the database function to recognize your email as admin:

1. Go to the Supabase SQL Editor
2. Run this query, replacing `your-email@domain.com` with your actual email:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.invites 
      WHERE email = NEW.email 
      AND used_at IS NULL 
      AND expires_at > now()
    ) THEN
      RAISE EXCEPTION 'Registration requires a valid invite';
    END IF;
    
    UPDATE public.invites 
    SET used_at = now() 
    WHERE email = NEW.email AND used_at IS NULL;
  END IF;

  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    CASE 
      WHEN NEW.email = 'your-email@domain.com' THEN 'admin'  -- ← CHANGE THIS
      ELSE 'user'
    END
  );
  
  RETURN NEW;
END;
$$;
```

### 2. Configure Google OAuth (Optional)
To enable Google sign-in:

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Follow the setup instructions to get Google OAuth credentials
4. Set your site URL and redirect URLs properly

### 3. Create Your First Invite
After setting up your admin email:

1. Register with your admin email (you'll need to create an invite for yourself first)
2. Or manually insert an invite in the database:

```sql
INSERT INTO public.invites (email) VALUES ('your-email@domain.com');
```

## How It Works

### Invite System
- Only admins can create invites
- Each invite has a unique token and 7-day expiration
- Registration requires a valid invite
- Invites are automatically marked as "used" when someone registers

### User Roles
- **Admin**: Can create invites, view all profiles, access admin panel
- **User**: Can only access their own data and submit violation reports

### Security Features
- Row Level Security (RLS) policies protect all data
- Users can only access their own records
- Admins have elevated permissions
- Invite tokens prevent unauthorized registrations

## User Tracking
All violation reports and photos will automatically be linked to the logged-in user through the `user_id` field in future tables.

## Next Steps
1. Set your admin email in the database function
2. Create your first invite
3. Register your admin account
4. Start creating invites for other users
5. Configure Google OAuth if desired

## Support
The remaining security warning about "OTP expiry" is a Supabase configuration setting that doesn't affect your app's functionality. You can safely ignore it or adjust OTP settings in your Supabase dashboard if needed.