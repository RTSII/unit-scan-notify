# 🎯 SPR Vice City - Priority Action Items

**Date:** October 6, 2025  
**Status:** Active Development

---

## 🔴 CRITICAL - Fix Immediately

### 1. **Export.tsx - Update to New Database Schema**
**Priority:** 🔴 CRITICAL  
**Status:** ❌ BROKEN  
**Blocking:** Email/Print export functionality

**Issue:**
- Currently reads from old `violation_forms` table (line 69)
- Doesn't join with `violation_photos` table
- Photos won't be included in exports
- May fail completely if old table is empty

**Required Changes:**
```typescript
// Current (WRONG):
.from('violation_forms')
.select('*')

// Should be:
.from('violation_forms_new')
.select(`
  *,
  violation_photos (
    id,
    storage_path,
    created_at
  )
`)
```

**Action Items:**
- [ ] Update database query to `violation_forms_new`
- [ ] Add `violation_photos` join
- [ ] Map photos array correctly
- [ ] Test email export with photos
- [ ] Test print export with photos
- [ ] Verify on mobile device

**Estimated Time:** 30-45 minutes  
**Assigned To:** Next development session

---

## 🟡 HIGH - Fix Soon

### 2. **TypeScript Types Regeneration**
**Priority:** 🟡 HIGH  
**Status:** ⚠️ WORKAROUND IN PLACE  
**Blocking:** Code quality, developer experience

**Issue:**
- Supabase types outdated (missing `violation_forms_new`, `violation_photos`)
- Multiple `@ts-ignore` comments throughout codebase
- Type safety compromised

**Required Action:**
```bash
npx supabase gen types typescript --project-id fvqojgifgevrwicyhmvj > src/integrations/supabase/types.ts
```

**Action Items:**
- [ ] Run Supabase type generation command
- [ ] Review generated types
- [ ] Remove `@ts-ignore` comments from:
  - Books.tsx
  - DetailsPrevious.tsx
  - DetailsLive.tsx
  - Admin.tsx
  - Export.tsx (after fix)
- [ ] Fix any new type errors
- [ ] Verify app still compiles and runs

**Estimated Time:** 15-20 minutes  
**Assigned To:** After Export.tsx fix

---

## 🟢 MEDIUM - Plan & Execute

### 3. **Old Data Migration (If Needed)**
**Priority:** 🟢 MEDIUM  
**Status:** ⏸️ ON HOLD  
**Blocking:** Access to historical violation data

**Issue:**
- Old violations stored in `violation_forms` table
- New app uses `violation_forms_new` table
- Historical data not visible in current app

**Decision Required:**
- ❓ Is historical data needed?
- ❓ How far back should migration go?
- ❓ Should old table be preserved?

**If Migration Needed:**
```sql
-- Map old data to new structure
INSERT INTO violation_forms_new (
  old_uuid_id,
  user_id,
  unit_number,
  occurred_at,
  location,
  description,
  status,
  created_at,
  updated_at
)
SELECT 
  id::uuid,
  user_id,
  unit_number,
  CASE 
    WHEN date IS NOT NULL AND time IS NOT NULL 
    THEN (date::timestamp + time::interval)
    ELSE date::timestamp
  END AT TIME ZONE 'UTC',
  location,
  description,
  status,
  created_at,
  updated_at
FROM violation_forms;

-- Migrate photos
INSERT INTO violation_photos (
  violation_id,
  uploaded_by,
  storage_path,
  created_at
)
SELECT 
  vfn.id,
  vf.user_id,
  unnest(vf.photos),
  vf.created_at
FROM violation_forms vf
JOIN violation_forms_new vfn ON vf.id::uuid = vfn.old_uuid_id
WHERE vf.photos IS NOT NULL;
```

**Action Items:**
- [ ] Decide if migration needed
- [ ] Test migration script on dev database
- [ ] Backup production database
- [ ] Run migration on production
- [ ] Verify old forms display correctly
- [ ] Update documentation

**Estimated Time:** 1-2 hours  
**Assigned To:** TBD (only if historical data required)

---

## 🔵 LOW - Future Enhancements

### 4. **Photo Storage Optimization**
**Priority:** 🔵 LOW  
**Status:** 📋 PLANNED  
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
**Priority:** 🔵 LOW  
**Status:** 📋 PLANNED  
**Blocking:** None (no validation currently)

**Issue:**
- `valid_units` table exists but unused
- No validation of unit numbers
- Users can enter invalid units
- Data quality concerns

**Proposed Solution:**
1. Fetch valid units on form load
2. Validate unit input against `valid_units` table
3. Show error for invalid units
4. Optionally: Autocomplete/dropdown for unit selection

**Action Items:**
- [ ] Review `valid_units` table structure
- [ ] Implement validation in DetailsPrevious.tsx
- [ ] Implement validation in DetailsLive.tsx
- [ ] Add user-friendly error messages
- [ ] Consider autocomplete UI
- [ ] Test validation logic

**Estimated Time:** 1 hour  
**Assigned To:** Future sprint

---

## 📊 Progress Tracking

### Overall System Health: 95% Complete

**Completed (Oct 6, 2025):**
- ✅ Database schema migration
- ✅ Photo display integration (all pages)
- ✅ Date formatting (MM/DD)
- ✅ Live capture workflow
- ✅ Gallery photos workflow
- ✅ Books page integration
- ✅ Admin panel integration
- ✅ Unit field auto-uppercase
- ✅ Search & filter functionality
- ✅ 3D carousel display
- ✅ Mobile responsiveness

**In Progress:**
- 🔄 Export.tsx update (CRITICAL)

**Pending:**
- ⏳ TypeScript types regeneration
- ⏳ Old data migration (if needed)
- ⏳ Photo storage optimization
- ⏳ Unit validation

---

## 🎯 Sprint Goals

### Current Sprint (Oct 6-7, 2025)

**Goal:** Fix all critical issues, achieve 100% functionality

**Must Complete:**
1. ✅ Fix Export.tsx database integration
2. ✅ Test email export
3. ✅ Test print export
4. ✅ Regenerate TypeScript types
5. ✅ Remove all `@ts-ignore` comments
6. ✅ Full mobile testing

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

## 📝 Notes

### Development Guidelines

1. **Always test on mobile** - Primary use case is iPhone field work
2. **Maintain normalized structure** - Use `violation_forms_new` and `violation_photos`
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

**Last Updated:** October 6, 2025 - 7:05 PM  
**Next Update:** After Export.tsx fix  
**Status:** 1 Critical Issue Remaining
