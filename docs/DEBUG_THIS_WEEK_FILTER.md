# Debugging "This Week" Filter Issue

## Problem
The "This Week" carousel is showing only placeholder cards instead of saved forms from the past 6 days + today.

## Debugging Steps Added

### 1. Console Logging in Books.tsx
Added logging to track:
- Total forms fetched from Supabase
- Sample form data (first 2 forms)
- Forms after search filter
- Date range for This Week/This Month filters
- Sample form date calculations
- Final filtered count for each filter

### 2. Console Logging in ViolationCarousel.tsx
Added logging to track:
- Number of forms received
- Number of mapped carousel items
- Sample carousel items (first 3)

## How to Debug

### Step 1: Open Browser Console
1. Navigate to the Books page (`/books`)
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab

### Step 2: Check the Logs

Look for these log messages:

```
[Books] Fetched forms from Supabase: X
[Books] Sample form data: [...]
[Books] Total forms after search filter: X
[Books] This Week filter - startOfWeek: ... today: ...
[Books] Sample form date check: {...}
[Books] This Week filtered count: X
[Carousel] Received forms: X
[Carousel] Mapped items: X
[Carousel] Sample items: [...]
```

### Step 3: Identify the Issue

#### Scenario A: No forms fetched from Supabase
**Log shows:** `[Books] Fetched forms from Supabase: 0`

**Cause:** No data in database OR RLS policy blocking query

**Solution:**
1. Check Supabase database - do you have any violation_forms records?
2. Check RLS policies - are they allowing team-wide reads?
3. Run this SQL in Supabase SQL Editor:
   ```sql
   SELECT count(*) FROM violation_forms;
   ```

#### Scenario B: Forms fetched but filtered to 0
**Log shows:** 
```
[Books] Fetched forms from Supabase: 10
[Books] This Week filtered count: 0
```

**Cause:** Date filtering is too restrictive OR forms are older than 7 days

**Solution:** Check the dates in `Sample form date check` log to see if forms are within range

#### Scenario C: Forms filtered but showing as placeholders
**Log shows:**
```
[Books] This Week filtered count: 5
[Carousel] Received forms: 5
[Carousel] Sample items: [{imageUrl: "placeholder", ...}]
```

**Cause:** Forms don't have photos OR photo URLs are not being generated correctly

**Solution:** 
1. Check if `Sample form data` shows `photos: []` (empty array)
2. Check if photos exist in Supabase Storage bucket `violation-photos`
3. Verify RLS policies allow reading from storage

## Expected Behavior

### Data Flow:
1. **Fetch**: Supabase query fetches ALL forms with photos
2. **Normalize**: Forms converted to include public photo URLs
3. **Search Filter**: Optional text search (if search box used)
4. **Time Filter**: Date range filter (This Week = past 6 days + today)
5. **Carousel Mapping**: Forms mapped to carousel items
6. **Display**: Cards show photos + date/unit badges

### This Week Filter Logic:
- **Start Date**: Today minus 6 days at 00:00:00
- **End Date**: Today at 00:00:00
- **Comparison**: Form's `occurred_at` or `created_at` normalized to date-only (time stripped)
- **Inclusive**: Forms matching startDate through endDate are included

## Common Issues

### Issue 1: Forms exist but have no photos
**Symptom:** `imageUrl: "placeholder"` in carousel items
**Fix:** Saved forms must have at least 1 photo in `violation_photos` table

### Issue 2: Photos exist but URLs not generated
**Symptom:** Forms have `photos: []` despite violation_photos records
**Check:** 
- Does `violation_photos.storage_path` exist and have correct path?
- Can you manually construct URL: `https://[project].supabase.co/storage/v1/object/public/violation-photos/[path]`?

### Issue 3: Date comparison timezone issue
**Symptom:** Forms excluded even though created today
**Fix:** Dates are normalized to midnight UTC - check if form dates are in future due to timezone

## Quick Test

Create a test form to verify the flow:
1. Go to Capture page
2. Create a violation form with:
   - Unit number
   - Today's date
   - At least 1 photo
3. Save the form
4. Navigate to Books page
5. Select "This Week" filter
6. Check console logs
7. Card should appear with photo background and badges

## Validation SQL Queries

Run these in Supabase SQL Editor to check data:

```sql
-- Check total forms
SELECT count(*) FROM violation_forms;

-- Check forms from past week
SELECT id, unit_number, occurred_at, created_at, status
FROM violation_forms
WHERE occurred_at >= (CURRENT_DATE - INTERVAL '6 days')
   OR created_at >= (CURRENT_DATE - INTERVAL '6 days')
ORDER BY created_at DESC;

-- Check forms with photos
SELECT vf.id, vf.unit_number, vf.occurred_at, 
       count(vp.id) as photo_count
FROM violation_forms vf
LEFT JOIN violation_photos vp ON vp.form_id = vf.id
GROUP BY vf.id, vf.unit_number, vf.occurred_at
ORDER BY vf.created_at DESC
LIMIT 20;

-- Check storage paths
SELECT form_id, storage_path, created_at
FROM violation_photos
ORDER BY created_at DESC
LIMIT 20;
```

## Next Steps

1. **Review console logs** using steps above
2. **Identify which scenario** matches your situation
3. **Apply the corresponding solution**
4. **Test with a fresh form** if needed
5. **Remove debug logs** once issue is resolved (or keep for monitoring)

---

**Note:** Debug logs can be removed by deleting the `console.log` statements added to Books.tsx and ViolationCarousel.tsx
