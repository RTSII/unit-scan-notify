---
description: Database Schema Change
auto_execution_mode: 3
---

Name: SPR Vice City - Database Migration (Rob Admin Only)
Trigger: When changing database schema

Steps:
1. Create migration: npm run migrate:new "description"
2. Write SQL in generated file
3. Include RLS policies if adding tables (admin = rob@ursllc.com only)
4. Test SQL in Supabase Dashboard
5. Apply migration in production
// turbo
6. Regenerate TypeScript types: npx supabase gen types typescript --project-id fvqojgifgevrwicyhmvj > src/integrations/supabase/types.ts
7. Update code to use new schema
8. Remove @ts-ignore comments (critical for TypeScript integrity)
9. Update DATABASE_MANAGEMENT.md if needed
10. Update WORKFLOW_REVIEW.md schema section
11. Add CHANGELOG.md entry
12. Test all affected workflows (especially admin functions)
13. Verify rob@ursllc.com admin access still works
14. Test on actual iPhone device
15. Commit and deploy