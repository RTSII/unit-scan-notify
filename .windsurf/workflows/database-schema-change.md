---
description: Database Schema Change
auto_execution_mode: 3
---

Name: SPR Vice City - Database Migration
Trigger: When changing database schema

Steps:
1. Create migration: npm run migrate:new "description"
2. Write SQL in generated file
3. Include RLS policies if adding tables
4. Test SQL in Supabase Dashboard
5. Apply migration in production
6. Regenerate TypeScript types
7. Update code to use new schema
8. Remove @ts-ignore comments
9. Update DATABASE_MANAGEMENT.md if needed
10. Update WORKFLOW_REVIEW.md schema section
11. Add CHANGELOG.md entry
12. Test all affected workflows
13. Commit and deploy