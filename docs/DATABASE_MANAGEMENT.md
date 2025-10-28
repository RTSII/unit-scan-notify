# Database Management - SPR Vice City (Single Admin: rob@ursllc.com)

This document explains how to manage database migrations and schema changes for the SPR Vice City project. The system is optimized for a single administrator (rob@ursllc.com) architecture.

## 🚀 Quick Start

The project now has **Supabase CLI installed locally** and custom migration helpers for easy database management.

## 📋 Available Commands

### Migration Management
```bash
# List all migration files
npm run migrate:list

# Create a new migration
npm run migrate:new "add new feature"

# Show migration SQL content
node migrate.js show filename.sql

# Show help
npm run migrate
```

### Supabase CLI Commands
```bash
# Direct Supabase CLI access
npm run supabase -- [command]

# Database status (requires local setup)
npm run db:status

# Push local changes to remote
npm run db:push

# Pull remote changes to local
npm run db:pull
```

## 🔧 How to Create and Apply Migrations

### 1. Create a New Migration
```bash
npm run migrate:new "add user preferences table"
```
This creates a timestamped SQL file in `supabase/migrations/`

### 2. Edit the Migration File
Open the generated file and add your SQL:
```sql
-- Migration: add user preferences table
-- Created: 2025-01-27T12:00:00.000Z

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);
```

### 3. Apply the Migration
Since we're using hosted Supabase:

1. **Copy the SQL content:**
   ```bash
   node migrate.js show 20250127120000_add_user_preferences_table.sql
   ```

2. **Go to Supabase Dashboard:**
   - Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your **SPR Vice City** project
   - Go to **SQL Editor**

3. **Paste and run the SQL**

## 📁 Migration Files Structure

```
supabase/
├── config.toml              # Project configuration
└── migrations/
    ├── 20250101000000_fix_violation_forms_schema.sql
    ├── 20250127000003_add_admin_violation_policies.sql
    ├── 20250127000004_add_user_activity_tracking.sql
    └── [your-new-migrations].sql
```

## 🔍 Current Database Schema

### Core Tables
- **`profiles`** - User profiles with roles (admin/user)
- **`violation_forms`** - Main violation data
- **`invites`** - User invitation system

### Views & Functions
- **`user_activity_summary`** - User statistics and metrics
- **`recent_team_activity`** - Last 30 days activity
- **`team_performance_summary`** - Overall team metrics
- **`get_team_stats()`** - Function for team statistics

### Row Level Security (RLS) - Single Admin Architecture
- ✅ All tables have RLS enabled
- ✅ Users can only edit their own data
- ✅ **Single Admin (rob@ursllc.com)** can view/edit/delete all data
- ✅ All users can view all violations (team transparency)
- ✅ Photos: team-wide read; **rob@ursllc.com only** delete; inserts constrained to uploader
- ✅ Storage: public read (thumbnails), authenticated uploads path-scoped to `user_id`, **rob@ursllc.com only** delete

### Critical Schema Notes (Oct 27, 2025)
- **Foreign Key Issue Fixed**: `violation_forms_user_id_fkey` does not exist - direct reference only
- **Admin Security**: All admin features hardcoded to rob@ursllc.com email
- **Performance Fix**: Photo URL cache clearing removed (caused 10-second delays)
- **Image Optimization**: Three-tier loading system (thumbnail/expanded/full)

### Storage Strategy (Photos)
- **Bucket**: `violation-photos`
- **Public Read**: Enabled via `public read violation-photos` storage policy for fast thumbnail access
- **Uploads**: Authenticated users only; must upload under their own top-level folder (`user_id/…`).
- **Deletes**: Admin-only for both `violation_photos` rows and Storage objects
- **Client Behavior**:
  - Images compressed client-side (canvas) to ~1600px max dimension, JPEG quality ~0.8
  - Filenames randomized with crypto-safe suffix; `Cache-Control: 31536000` on upload
  - App stores `getPublicUrl(path)` in `violation_photos.storage_path`

### Final Policy Snippet (One-and-Done)
Run in Supabase SQL editor to enforce the security model consistently:

```sql
-- public.violation_photos
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='violation_photos'
      and policyname='Photo DELETE admin_only'
  ) then
    create policy "Photo DELETE admin_only"
    on public.violation_photos
    for delete
    to authenticated
    using (
      exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid() and coalesce(p.role,'user') = 'admin'
      )
    );
  end if;
end$$;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='violation_photos'
      and policyname='Photo INSERT by uploader'
  ) then
    drop policy "Photo INSERT by uploader" on public.violation_photos;
  end if;
  create policy "Photo INSERT by uploader"
  on public.violation_photos
  for insert
  to authenticated
  with check (uploaded_by = auth.uid());
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='violation_photos'
      and policyname='Photo SELECT team_read'
  ) then
    create policy "Photo SELECT team_read"
    on public.violation_photos
    for select
    to authenticated
    using (true);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='violation_photos'
      and policyname='Photo UPDATE uploader_only'
  ) then
    create policy "Photo UPDATE uploader_only"
    on public.violation_photos
    for update
    to authenticated
    using (uploaded_by = auth.uid())
    with check (uploaded_by = auth.uid());
  end if;
end$$;

-- storage.objects (bucket: violation-photos)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='Admin delete violation-photos'
  ) then
    create policy "Admin delete violation-photos"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'violation-photos'
      and exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid() and coalesce(p.role,'user') = 'admin'
      )
    );
  end if;
end$$;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='Authenticated upload violation-photos'
  ) then
    drop policy "Authenticated upload violation-photos" on storage.objects;
  end if;
  create policy "Authenticated upload violation-photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'violation-photos'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='authenticated read violation-photos'
  ) then
    create policy "authenticated read violation-photos"
    on storage.objects
    for select
    to authenticated
    using (bucket_id = 'violation-photos');
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='public read violation-photos'
  ) then
    create policy "public read violation-photos"
    on storage.objects
    for select
    to anon
    using (bucket_id = 'violation-photos');
  end if;
end$$;
```

### Verify Policies and Objects
```sql
-- Show USING and WITH CHECK for policies
select policyname, schemaname, tablename, roles, cmd,
       qual as using_expr,
       with_check as with_check_expr
from pg_policies
where (schemaname='public' and tablename='violation_photos')
   or (schemaname='storage' and tablename='objects')
order by schemaname, tablename, policyname;

-- List recent Storage objects in the bucket
select name, bucket_id, path_tokens, created_at
from storage.objects
where bucket_id='violation-photos'
order by created_at desc
limit 25;
```

## 📱 Mobile Notes
- This is a mobile-first web app.
- On-device debugging is limited; prefer solutions that don’t require mobile console access.
- Use desktop localhost for inspection; verify on-device after.

## 🛠️ Troubleshooting

### CLI Connection Issues
If you get connection errors with `npx supabase` commands:
- Use the manual migration approach (copy/paste SQL)
- The custom `migrate.js` helper works offline
- All core functionality is available through the dashboard

### Migration Best Practices
1. **Always test migrations** in a development environment first
2. **Use descriptive names** for migration files
3. **Include rollback instructions** in comments
4. **Add RLS policies** for new tables
5. **Update TypeScript types** after schema changes

## 📞 Support

If you need help with database changes:
1. Check existing migrations for examples
2. Use `npm run migrate` to see available commands
3. Test SQL in Supabase Dashboard before creating migrations

---

**Project:** SPR Vice City - Mobile Violation Management  
**Database:** Supabase (Hosted)  
**CLI Version:** 2.39.2