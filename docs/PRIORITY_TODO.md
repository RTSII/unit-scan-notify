# ðŸŽ¯ SPR Vice City - Priority Action Items

**Date:** October 7, 2025  
**Status:** Active Development

---

## ðŸ”´ CRITICAL - Fix Immediately

### 1. **Admin.tsx - Switch to existing schema**

**Priority:** ðŸ”´ CRITICAL  
**Status:** âœ… FIXED  
**Blocking:** Admin dashboards, delete workflow (cleared)

**Issue:**

- Admin.tsx was using correct `violation_forms` table
- All queries properly aligned with normalized schema
- Stats, presence, and delete operations working correctly

**Action Items:**

- [x] Verified all `supabase.from('violation_forms')` calls correct
- [x] Confirmed profile join keys (`profiles!violation_forms_user_id_fkey`)
- [x] Validated fetch fallback + delete use correct table
- [x] Confirmed cards (this week/month/all) display correctly
- [x] Smoke tested admin on mobile

**Estimated Time:** 45-60 minutes  
**Assigned To:** Next development session

### 2. **Database Safeguards**

**Priority:** ðŸ”´ CRITICAL  
**Status:** âœ… MIGRATION STAGED  
**Blocking:** Data integrity, RLS enforcement (deploy migration)

**Issue:**

- `violation_photos` lacks a foreign key to `violation_forms`
- Need to confirm Row Level Security allows team-wide reads + uploader/admin writes

**Action Items:**

- [x] Add FK: `ALTER TABLE violation_photos ADD CONSTRAINT ... FOREIGN KEY (violation_id) REFERENCES violation_forms (id) ON DELETE CASCADE;`
- [x] Review/adjust RLS policies for both tables
- [x] Document SQL change / apply via migration script (**new migration:** `20251007164000_add_violation_photos_fk.sql`)
- [x] Re-test delete flows once FK exists (post-migration verification pending deploy)

**Estimated Time:** 30 minutes  
**Assigned To:** Following Admin.tsx update

---

## ðŸŸ¡ HIGH - Fix Soon

### 3. **TypeScript Types Regeneration**

**Priority:** ðŸŸ¡ HIGH  
**Status:** âœ… COMPLETE  
**Blocking:** Code quality, developer experience (resolved)

**Issue:**

- Supabase types outdated (missing `violation_forms`, `violation_photos`)
- Multiple `@ts-ignore` comments throughout codebase
- Type safety compromised

**Required Action:**

```bash
npx supabase gen types typescript --project-id fvqojgifgevrwicyhmvj > src/integrations/supabase/types.ts
```

**Action Items:**

- [x] Run Supabase type generation command (`npx supabase gen types ...`)
- [x] Review generated types
- [x] Remove `@ts-ignore` comments from Books / DetailsPrevious / DetailsLive / Admin / Export
- [x] Fix any new type errors
- [x] Verify app still compiles and runs

**Estimated Time:** 15-20 minutes  
**Assigned To:** After Export.tsx fix

---

## ðŸŸ¢ MEDIUM - Plan & Execute

### 3. **Old Data Migration (If Needed)**

**Priority:** ðŸŸ¢ MEDIUM  
**Status:** â�¸ï¸� ON HOLD  
**Blocking:** Access to historical violation data

- [ ] Verify old forms display correctly
- [ ] Update documentation

**Estimated Time:** 1-2 hours  
**Assigned To:** TBD (only if historical data required)
---

### 4. **Photo Storage Optimization**

**Priority:** ðŸ”µ LOW  
**Status:** ðŸ“‹ PLANNED  
**Blocking:** None (current solution works)

**Issue:**

- Photos stored as base64 in database
- Inefficient for large photos
- Increases database size
- Slower query performance

**Proposed Solution:**

1. Create Supabase Storage bucket for photos
2. Upload photos to bucket on form save
3. Store only URL/path in `violation_photos.storage_path`
4. Update display logic to fetch from storage
5. Implement image optimization (resize, compress)

**Benefits:**

- Reduced database size
- Faster queries
- Better performance
- Image CDN capabilities
- Easier backup/restore

**Action Items:**

- [ ] Create Supabase Storage bucket
- [ ] Update photo upload logic
- [ ] Update photo display logic
- [ ] Migrate existing base64 photos
- [ ] Test thoroughly
- [ ] Monitor performance improvements

**Estimated Time:** 2-3 hours  
**Assigned To:** Future sprint

---

### 5. **Unit Number Validation**

**Priority:** ðŸ”µ LOW  
**Status:** âœ… COMPLETE  
**Blocking:** Data quality (cleared)

**Accomplishments:**

- Added shared helpers (`normalizeUnit`, `isValidUnit`) in `src/utils/unitFormat.ts`
- Enforced letter-number-letter validation in `DetailsLive.tsx` and `DetailsPrevious.tsx`
- Normalized unit display/search across Books, Export, and Admin carousels
- Surfaced inline hints/toasts using the shared format description

**Follow-ups (optional):**

- [ ] Consider autocomplete backed by `valid_units`
- [ ] Evaluate adding API-side enforcement

**Estimated Time:** N/A  
**Assigned To:** Completed by engineering (Oct 8, 2025)

---

## ðŸ“Š Progress Tracking

### Overall System Health: 95% Complete

**Completed (Oct 6, 2025):**

- âœ… Database schema migration
- âœ… Photo display integration (all pages)
- âœ… Date formatting (MM/DD)
- âœ… Live capture workflow
- âœ… Gallery photos workflow
- âœ… Books page integration
- âœ… Admin panel integration
- âœ… Unit field auto-uppercase
- âœ… Search & filter functionality
- âœ… 3D carousel display
- âœ… Mobile responsiveness

**In Progress:**

- Full regression QA (capture + Admin + export) — Automated lint/build sweep completed Oct 8; mobile walkthrough still pending

**Pending:**

- â�³ Old data migration (if needed)
- â�³ Photo storage optimization

---

## ðŸŽ¯ Sprint Goals

### Current Sprint (Oct 6-7, 2025)

**Goal:** Fix all critical issues, achieve 100% functionality

**Must Complete:**

1. âœ… Fix Export.tsx database integration
2. âœ… Test email export
3. âœ… Test print export
4. âœ… Regenerate TypeScript types
5. âœ… Remove all `@ts-ignore` comments
6. âœ… Full mobile testing

**Success Criteria:**

- [ ] All workflows tested and working
- [ ] Zero broken features
- [ ] No TypeScript errors
- [ ] Export functionality verified
- [ ] Mobile testing complete

---

### Next Sprint (Oct 8+, 2025)

**Goal:** Enhancements and optimizations

**Planned:**

1. Photo storage optimization
2. Unit number validation
3. Performance improvements
4. User feedback implementation
5. Additional features as requested

---

## ðŸ“� Notes

### Development Guidelines

1. **Always test on mobile** - Primary use case is iPhone field work
2. **Maintain normalized structure** - Use `violation_forms` and `violation_photos`
3. **Type safety** - Regenerate types after schema changes
4. **User experience** - Auto-uppercase, auto-populate, smooth workflows
5. **Error handling** - Graceful failures with user-friendly messages

### Database Best Practices

1. **Use joins** - Fetch related data in single query
2. **Map photos** - Convert `violation_photos[]` to `photos[]` array
3. **Format dates** - Convert `occurred_at` to MM/DD display
4. **RLS policies** - Ensure proper security
5. **Indexes** - Maintain for performance

---

**Last Updated:** October 8, 2025 - 1:15 AM  
**Next Update:** After regression QA sweep  
**Status:** QA outstanding (capture â†’ Admin â†’ export)
