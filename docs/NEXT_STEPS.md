# 🚧 Live Capture Fix Initiative — Status @ October 9, 2025

## 🔎 Snapshot

We pivoted away from the proposed `violation_forms_new` table and are realigning every page with the **existing** Supabase schema: `violation_forms` + `violation_photos`. The immediate goal is still the same—get Book Em / live capture saving reliably (forms + photos) and complete the user's "steps 1–4". We are midstream: several pages now target the correct tables, but types, admin tooling, and QA remain outstanding.

## ✅ Progress Since October 6

- **Details capture flows updated** ✅ **FIXED October 9**
  - `src/pages/DetailsLive.tsx` saves into `violation_forms` and `violation_photos` using `occurred_at` + uppercase unit numbers.
  - **Critical bug fixed**: Added missing `occurred_at` field to insert payload and corrected `.single()` method call.
  - Forms now save successfully and redirect to Books page with photos stored in `violation_photos` table.
  - `src/components/DetailsPrevious.tsx` has been refactored to read/write the normalized schema, including editing existing photos (retain/delete/add) and the new centered photo picker UI.

- **Exports are unblocked**
  - `src/pages/Export.tsx` now queries `violation_forms` with an eager `violation_photos` join so email/print exports include the photo set.
- **Books list partially aligned**
  - `src/pages/Books.tsx` reads from `violation_forms` and joins `violation_photos`, restoring Books > Gallery visibility. (Type ignores remain until we regenerate types.)

## 🔄 In Progress

 - **Admin console alignment**
  - Verify `src/pages/Admin.tsx` queries (stats, deletes, fallback joins) are aligned to `violation_forms` and `violation_photos`; adjust if any legacy references remain.

- **Supabase type regeneration**
  - Supabase JS types do not include `violation_forms`/`violation_photos`, forcing multiple `@ts-ignore`. Once schema references settle, run:

    ```bash
    ```

  - Remove the ignores in `Books.tsx`, `DetailsLive.tsx`, `DetailsPrevious.tsx`, `Admin.tsx`, `Export.tsx`, and fix any new TS errors.

- **Database safeguards**
  - Add the missing foreign key: `violation_photos.violation_id → violation_forms.id (ON DELETE CASCADE)`.
  - Reconfirm Row Level Security rules cover team-wide reads and uploader/admin writes.

- **Regression QA**
  - Once the above are done, walk through: Capture → Book Em, Gallery edits, Books 3D carousel, Admin dashboards, Export email/print.

## 🎯 Remaining “Steps 1–4” Checklist

1. **Point all queries at `violation_forms`**
   - [x] DetailsLive
   - [x] DetailsPrevious
   - [x] Export
   - [x] Books
   - [ ] Admin *(next up)*

2. **Add safeguards (FK + RLS review)**
   - [ ] Add FK from `violation_photos.violation_id` to `violation_forms.id`
   - [ ] Validate RLS policies

3. **Regenerate Supabase types**
   - [ ] Run type generator & remove `@ts-ignore`

4. **Full QA**
   - [ ] Mobile live capture workflow
   - [ ] Books/gallery review
   - [ ] Admin stats + deletes
   - [ ] Export email/print

## 📋 Testing Checkpoints (to run after Admin + FK + types)

- **Live Capture**: Capture photo → Book Em redirect → ensure form + photo present in Books, with MM/DD date.
- **Edit Previous**: Load an existing notice, remove/add photos, save, confirm retained and deleted photos behave.
- **Books**: 3D carousel shows recent forms with photos and dates.
- **Admin**: Stats populate, latest forms stack loads, delete button works.
- **Export**: Email and print include descriptions + photos.

## 📝 Notes & Next Actions

- After types regenerate, sweep for any stale references to `_new` or legacy columns.
- Coordinate Supabase DB changes (FK, RLS) with proper migration scripts or SQL runbooks.

---

**Last Updated:** October 9, 2025 – 7:37 PM ET  
**Maintainer:** Cascade pair-programming session
