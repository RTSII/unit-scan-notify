# 🎯 SPR Vice City - Development Rules & Workflows

**Date:** October 18, 2025  
**Status:** Active Development Standards  
**Purpose:** Comprehensive guide for maintaining code quality and consistency

---

## 📋 **GENERAL DEVELOPMENT RULES**

### **Mobile-First Development**
- ✅ ALWAYS design and test for iPhone 13+ FIRST, then enhance for desktop
- ✅ Use iPhone-specific breakpoints from `tailwind.config.ts`
- ✅ Minimum touch target size: **44px** (iOS standard)
- ✅ Test on actual iPhone device via Lovable production URL before considering features complete
- ✅ Viewport targets: 390px (iPhone 13/14/15), 393px (Pro), 428px (Pro Max)

### **Photo Storage Pattern (CRITICAL)**
> **Fixed October 18, 2025** - This pattern is now standardized across all workflows

- ❌ **NEVER** store base64 images in the database
- ✅ **ALWAYS** upload photos to Supabase Storage bucket: `violation-photos`
- ✅ Store ONLY the storage path in `violation_photos.storage_path` (format: `{user_id}/{filename}.jpg`)
- ✅ Use client-side compression: max 1600px, JPEG 80% quality
- ✅ Generate public URLs via `supabase.storage.getPublicUrl(path)` when displaying

**Example Implementation:**
```typescript
// 1. Compress image
const compressedBlob = await compressImage(file, 1600, 0.8);

// 2. Upload to storage
const path = `${userId}/${Date.now()}.jpg`;
await supabase.storage.from('violation-photos').upload(path, compressedBlob);

// 3. Store path in database
await supabase.from('violation_photos').insert({
  violation_id: formId,
  storage_path: path,
  uploaded_by: userId
});

// 4. Display image
const { data } = supabase.storage.from('violation-photos').getPublicUrl(path);
```

### **Date Filtering Consistency**
> **Unified October 18, 2025** - All pages use identical logic

- ✅ **"This Week"** = past 6 days + today (7 days total)
- ✅ **"This Month"** = 1st of current month through today
- ✅ **ALWAYS** normalize dates to midnight (strip time) before comparing
- ✅ **ALWAYS** prioritize `occurred_at` over `created_at`
- ✅ Use this pattern across ALL pages (Books, Export, Admin)

**Standard Implementation:**
```typescript
// "This Week" Filter
const getThisWeekForms = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Past 6 days + today = 7 days total
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 6);
  
  return forms.filter(form => {
    const formDate = new Date(form.occurred_at || form.created_at);
    // Normalize to date only (ignore time)
    const formDateOnly = new Date(formDate.getFullYear(), formDate.getMonth(), formDate.getDate());
    return formDateOnly >= startOfWeek;
  });
};

// "This Month" Filter
const getThisMonthForms = () => {
  const now = new Date();
  // Start of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return forms.filter(form => {
    const formDate = new Date(form.occurred_at || form.created_at);
    // Normalize to date only (ignore time)
    const formDateOnly = new Date(formDate.getFullYear(), formDate.getMonth(), formDate.getDate());
    return formDateOnly >= startOfMonth;
  });
};
```

### **Team Visibility Principle**
- ✅ ALL users can view ALL violations (no user_id filtering on reads)
- ✅ Display user attribution via profile join
- ✅ Only admin can delete/edit violations
- ❌ **NEVER** filter `violation_forms` by `user_id` in Books, Export, or Admin pages

**Correct Pattern:**
```typescript
// ✅ CORRECT - Shows all team violations
const { data } = await supabase
  .from('violation_forms')
  .select(`
    *,
    profiles!violation_forms_user_id_fkey (
      email,
      full_name,
      role
    ),
    violation_photos (
      id,
      storage_path,
      created_at
    )
  `)
  // NO .eq('user_id', user.id) filter here!
  .order('created_at', { ascending: false });
```

### **3D Carousel Consistency**
> **Reference:** `docs/3d-carousel.md`

- ✅ Touch controls MUST be isolated to thumbnail cards only
- ✅ Parent container: `pointerEvents: 'none'`, `touchAction: 'pan-y'`
- ✅ Individual cards: `drag="x"` when carousel is active
- ✅ Use same filtering logic across Books.tsx, Export.tsx, Admin.tsx
- ✅ Snap to nearest face on release
- ✅ Disable drag momentum with gentler spring

**Touch Isolation Pattern:**
```typescript
// Container
<div style={{ pointerEvents: 'none', touchAction: 'pan-y' }}>
  {/* Carousel cards */}
  {cards.map((card, i) => (
    <motion.div
      drag="x"
      style={{
        pointerEvents: isVisible ? 'auto' : 'none',
        touchAction: isVisible ? 'none' : 'auto'
      }}
    />
  ))}
</div>
```

### **Database Schema**
- ✅ Primary table: `violation_forms` (bigint PK)
- ✅ Photos table: `violation_photos` (FK to violation_forms.id with ON DELETE CASCADE)
- ❌ Never use legacy `violation_forms_backup_before_migration`
- ✅ Always use proper joins for photos and profiles
- ✅ Storage bucket: `violation-photos`

**Schema Reference:**
```sql
-- violation_forms
id: bigint (PK)
user_id: uuid (FK → auth.users)
unit_number: text
occurred_at: timestamp with time zone
location: text (violation type)
description: text
status: text (default: 'saved')
created_at, updated_at: timestamp

-- violation_photos
id: bigint (PK)
violation_id: bigint (FK → violation_forms.id ON DELETE CASCADE)
uploaded_by: uuid (FK → auth.users)
storage_path: text (e.g., "{user_id}/{filename}.jpg")
created_at: timestamp
```

### **TypeScript & Code Quality**
- ❌ NO `@ts-ignore` comments allowed
- ✅ Regenerate Supabase types after schema changes
- ✅ Use proper TypeScript types from `src/integrations/supabase/types.ts`
- ✅ Keep imports clean and organized
- ✅ Remove all debug `console.log` statements before committing

**Type Generation Command:**
```bash
npx supabase gen types typescript --project-id fvqojgifgevrwicyhmvj > src/integrations/supabase/types.ts
```

### **Git & Deployment**
- ✅ Commit frequently with descriptive messages
- ✅ Push to GitHub triggers auto-deploy on Lovable (1-2 min)
- ✅ Update `CHANGELOG.md` for all significant changes
- ✅ Update `WORKFLOW_REVIEW.md` when fixing critical issues
- ✅ Test on localhost first, then production URL
- ✅ Verify on actual iPhone device before considering complete

**Commit Message Format:**
```
Category: Brief description

- Detailed point 1
- Detailed point 2
```

### **Documentation Standards**
- ✅ Keep `docs/WORKFLOW_REVIEW.md` as source of truth for system status
- ✅ Update `docs/3d-carousel.md` for carousel changes
- ✅ Reference existing .md files before asking questions
- ✅ Create new .md files for major features or fixes
- ✅ Update `README.md` when setup process changes

---

## 🔄 **DEVELOPMENT WORKFLOWS**

### **Workflow 1: Bug Fix Process**

**Trigger:** When fixing a bug

1. **Reproduce** the bug locally
2. **Check** `WORKFLOW_REVIEW.md` for related known issues
3. **Add** console.log for debugging (if needed)
4. **Implement** fix following established patterns
5. **Remove** all debug console.log statements
6. **Test** on localhost thoroughly
7. **Update** `WORKFLOW_REVIEW.md` if it was a critical bug
8. **Add** entry to `CHANGELOG.md` if significant
9. **Commit** with descriptive message
10. **Push** to GitHub (auto-deploys to Lovable)
11. **Test** on production URL via iPhone
12. **Verify** fix works on actual device

**Example Commit:**
```
Fix: Resolve photo upload issue in DetailsLive

- Fixed base64 storage bug
- Implemented Supabase Storage upload
- Added client-side compression
```

### **Workflow 2: New Feature Development**

**Trigger:** When adding a new feature

1. **Check** `TODO.md` and `PRIORITY_TODO.md` for related tasks
2. **Review** relevant documentation (`WORKFLOW_REVIEW.md`, etc.)
3. **Design** mobile-first (iPhone 13+ viewport)
4. **Implement** feature following established patterns
5. **Add** TypeScript types (no @ts-ignore)
6. **Test** on localhost extensively
7. **Update** relevant .md documentation
8. **Add** `CHANGELOG.md` entry with version number
9. **Update** `TODO.md` to mark task complete
10. **Commit** and push to GitHub
11. **Test** on production via iPhone
12. **Monitor** for errors in production

### **Workflow 3: Database Schema Change**

**Trigger:** When changing database schema

1. **Create** migration: `npm run migrate:new "description"`
2. **Write** SQL in generated file (`supabase/migrations/`)
3. **Include** RLS policies if adding tables
4. **Test** SQL in Supabase Dashboard SQL Editor
5. **Apply** migration in production
6. **Regenerate** TypeScript types:
   ```bash
   npx supabase gen types typescript --project-id fvqojgifgevrwicyhmvj > src/integrations/supabase/types.ts
   ```
7. **Update** code to use new schema
8. **Remove** any @ts-ignore comments
9. **Update** `DATABASE_MANAGEMENT.md` if needed
10. **Update** `WORKFLOW_REVIEW.md` schema section
11. **Add** `CHANGELOG.md` entry
12. **Test** all affected workflows
13. **Commit** and deploy

### **Workflow 4: 3D Carousel Modification**

**Trigger:** When modifying carousel behavior

1. **Read** `docs/3d-carousel.md` for current spec
2. **Identify** which pages are affected (Books, Export, Admin)
3. **Make** changes to `ViolationCarousel3D` component
4. **Ensure** touch controls remain isolated to cards
5. **Update** filtering logic if needed (keep consistent across all pages)
6. **Test** on iPhone (touch/swipe/flick behavior)
7. **Update** `docs/3d-carousel.md` with changes
8. **Update** `CHANGELOG.md`
9. **Verify** consistency across all three pages
10. **Commit** and deploy
11. **Test** on production iPhone

### **Workflow 5: Photo Storage Implementation**

**Trigger:** When implementing photo upload/display

1. **Use** client-side compression (1600px, JPEG 80%)
2. **Upload** to Supabase Storage `violation-photos` bucket
3. **Generate** unique filename: `{user_id}/{timestamp}.jpg`
4. **Store** path in `violation_photos.storage_path`
5. **Display** using `supabase.storage.getPublicUrl(path)`
6. **Never** store base64 or full URLs in database
7. **Test** upload and display on mobile
8. **Verify** file appears in Supabase Storage dashboard

---

## 🚨 **CRITICAL RULES - NEVER VIOLATE**

### **🔴 NEVER:**
- Store base64 images in database
- Filter `violation_forms` by `user_id` in Books/Export/Admin
- Use `@ts-ignore` without regenerating types
- Commit debug console.log statements
- Deploy without testing on actual iPhone
- Modify carousel without checking all three pages
- Change date filtering logic without updating all pages
- Skip documentation updates for significant changes

### **✅ ALWAYS:**
- Upload photos to Supabase Storage
- Test mobile-first on iPhone viewport
- Use consistent date filtering across all pages
- Isolate carousel touch controls to cards
- Show all violations to all users (team transparency)
- Update `CHANGELOG.md` for significant changes
- Update `WORKFLOW_REVIEW.md` for critical fixes
- Regenerate types after schema changes
- Test on production URL after deployment

---

## 📚 **QUICK REFERENCE**

### **File Locations**
- **Source of Truth:** `docs/WORKFLOW_REVIEW.md`
- **Carousel Spec:** `docs/3d-carousel.md`
- **Database Schema:** `WORKFLOW_REVIEW.md` or `DATABASE_MANAGEMENT.md`
- **Mobile Patterns:** `MOBILE_RESPONSIVE_IMPLEMENTATION.md`
- **Permissions:** `PERMISSIONS_STRUCTURE.md`
- **Types:** `src/integrations/supabase/types.ts`

### **Key Commands**
```bash
# Development
npm run dev                  # Start dev server

# Database
npm run migrate:new "desc"   # Create migration
npm run migrate:list         # List migrations

# Types
npx supabase gen types typescript --project-id fvqojgifgevrwicyhmvj > src/integrations/supabase/types.ts

# Git
git add -A
git commit -m "message"
git push
```

### **Production**
- **URL:** https://spr-vicecity.lovable.app/
- **Deploy:** Auto-deploy from GitHub main (1-2 min)
- **Testing:** Always verify on actual iPhone device

---

## 🎯 **ENFORCEMENT**

These rules are enforced through:
1. **Code reviews** - Check for pattern violations
2. **Documentation updates** - Keep standards current
3. **Testing requirements** - Mobile-first verification
4. **Memory system** - AI assistant context
5. **This document** - Central reference

**Last Updated:** October 18, 2025  
**Next Review:** Monthly or after major changes

---

**SPR Vice City** - Building professional violation management with consistent patterns 🌴⚡
