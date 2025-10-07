# Database Management - SPR Vice City

This document explains how to manage database migrations and schema changes for the SPR Vice City project.

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

### Row Level Security (RLS)
- ✅ All tables have RLS enabled
- ✅ Users can only edit their own data
- ✅ Admins can view/edit all data
- ✅ All users can view all violations (team transparency)

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