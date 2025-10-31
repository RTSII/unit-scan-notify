---
description: Automated Supabase SQL Migration Workflow
auto_execution_mode: 3
---

# Supabase Migration Workflow - Fully Automated

This workflow handles ALL Supabase database changes automatically using Supabase MCP integration.

## When to Use This Workflow

- Creating new tables
- Modifying existing tables
- Adding indexes or constraints
- Creating/updating functions or triggers
- Adding RLS policies
- Any database schema changes

## Automated Steps

### 1. Create Migration File

AI will create timestamped migration file in `supabase/migrations/`

### 2. Write Idempotent SQL

AI will ensure all SQL is safe to re-run:
- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `DO $$ ... EXCEPTION WHEN duplicate_object` for policies
- `CREATE OR REPLACE FUNCTION` for functions
- `DROP TRIGGER IF EXISTS` before CREATE TRIGGER
- `ON CONFLICT DO NOTHING` for data inserts

### 3. Apply Migration via Supabase MCP
// turbo

AI will use `mcp3_apply_migration` to execute SQL directly on database.

### 4. Regenerate TypeScript Types
// turbo

```bash
npx supabase gen types typescript --project-id fvqojgifgevrwicyhmvj > src/integrations/supabase/types.ts
```

### 5. Verify Migration Success

AI will:
- Check table creation via `mcp3_list_tables`
- Run `mcp3_get_advisors` for security/performance checks
- Verify data if needed via `mcp3_execute_sql`

### 6. Update Documentation

Update these files:
- `docs/DATABASE_MANAGEMENT.md` - Schema changes
- `docs/WORKFLOW_REVIEW.md` - System status
- `docs/CHANGELOG.md` - Version history

## Project Configuration

- **Project ID**: fvqojgifgevrwicyhmvj
- **Admin Email**: rob@ursllc.com
- **Migration Path**: `supabase/migrations/`
- **Types Path**: `src/integrations/supabase/types.ts`

## Migration Best Practices

### RLS Policies:
- Admin: `auth.jwt() ->> 'email' = 'rob@ursllc.com'`
- User read: `true` or `auth.uid() = user_id`
- Always enable: `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY`

### Indexes:
- Foreign keys: `idx_[table]_[column]`
- Filters: `idx_[table]_[filter_column]`
- Sorting: `idx_[table]_[sort_column]_DESC`

## Supabase MCP Tools

- `mcp3_apply_migration` - Apply migration to database
- `mcp3_execute_sql` - Execute raw SQL queries
- `mcp3_list_tables` - List all tables in schemas
- `mcp3_get_advisors` - Security/performance checks
- `mcp3_generate_typescript_types` - Generate TS types
- `mcp3_list_migrations` - List applied migrations

## Notes

- **Fully Automated**: No user intervention needed
- **Always Idempotent**: Safe to re-run migrations
- **Type-Safe**: TypeScript types auto-regenerated
- **Documented**: All changes logged
- **Secure**: RLS policies enforced
- **Mobile-First**: Schema optimized for iPhone usage
