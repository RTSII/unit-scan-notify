# 3D Carousel – Unified Spec and App-Wide Implementation

**Last Updated:** October 18, 2025  
**Status:** ✅ Consistent across all pages

This document is the authoritative spec and usage guide for the 3D carousel used app-wide.

- **Component**: `ViolationCarousel3D` in `src/components/ViolationCarousel.tsx`
- **Pages**: `src/pages/Books.tsx`, `src/pages/Export.tsx`, `src/pages/Admin.tsx`

---

## ⚠️ CRITICAL: Data Contract (MUST FOLLOW)

**ALL pages using ViolationCarousel3D MUST use the EXACT SAME data structure.**

### Required Interface

```typescript
interface ViolationForm {
  id: string;
  unit_number: string;
  date?: string; // Legacy field - MM/DD format
  time?: string; // Legacy field
  occurred_at?: string; // New timestamp field - ISO format
  location: string;
  description: string;
  status: string;
  created_at: string;
  photos: string[]; // Array of storage paths or URLs
  violation_photos: Array<{
    id: string;
    storage_path: string;
    created_at: string;
  }>;
}
```

### Required Database Query Pattern

**DO THIS (Export.tsx pattern):**
```typescript
const { data, error } = await supabase
  .from('violation_forms')
  .select(`
    *,
    violation_photos (
      id,
      storage_path,
      created_at
    )
  `)
  .order('created_at', { ascending: false })
  .limit(500)
  .returns<(ViolationFormRow & { violation_photos: ViolationPhotoRow[] | null })[]>();
```

### Required Data Mapping Pattern

**DO THIS (Export.tsx pattern):**
```typescript
const formsWithPhotos: ViolationForm[] = (data ?? []).map((form) => {
  const photosArray = Array.isArray(form.violation_photos)
    ? form.violation_photos.filter(
        (photo): photo is ViolationPhotoRow => Boolean(photo)
      )
    : [];

  return {
    id: String(form.id),
    unit_number: normalizeUnit(form.unit_number ?? ''),
    occurred_at: form.occurred_at ?? undefined,
    location: form.location ?? '',
    description: form.description ?? '',
    status: form.status ?? 'saved',
    created_at: form.created_at ?? new Date().toISOString(),
    photos: photosArray
      .map((photo) => photo.storage_path)
      .filter((path): path is string => typeof path === 'string' && path.length > 0),
    violation_photos: photosArray
      .map((photo) => ({
        id: String(photo.id),
        storage_path: photo.storage_path ?? '',
        created_at: photo.created_at ?? '',
      }))
      .filter((photo) => photo.storage_path.length > 0),
  };
});
```

### ❌ DON'T DO THIS

- **DON'T** select specific columns instead of `*`
- **DON'T** create custom interfaces (SavedForm, CustomForm, etc.)
- **DON'T** use custom normalization functions
- **DON'T** convert storage paths to URLs in the data layer (ViolationCarousel handles this)

### Why This Matters

The carousel component (`ViolationCarousel.tsx`) has a `FormLike` interface that expects this exact structure. Any deviation causes:
- ❌ 500 database errors (wrong column selection)
- ❌ Photos not displaying (wrong data mapping)
- ❌ Inconsistent behavior across pages

**When adding carousel to a new page:** Copy Export.tsx data fetching pattern exactly, then add any page-specific fields to the interface.

---

## Purpose
- **Dense ring** of square, rounded thumbnail cards with minimal spacing.
- **Continuous drag/rotate** experience with an “infinite” feel and snapping for control.
- **Readable overlay**: Date (xx/xx) and Unit# (XXX) centered at top of card in neon pink color on each thumbnail.
- **Mobile-first** responsiveness and short track containment.

---

## Visual Spec
- **Container**
  - `div.relative.h-[140px].sm:h-[160px].w-full.overflow-hidden.rounded-xl.bg-black/20`
  - Pages may pass a custom height via `heightClass`:
    - Recommended: `h-[160px] sm:h-[200px]` (optimized for mobile)
    - Default: `h-[140px] sm:h-[160px]`
  - Inner wrapper with perspective and 3D preservation:
    - `div.flex.h-full.items-center.justify-center.bg-black/10`
    - Inline style: `{ perspective: 600–800px, transformStyle: 'preserve-3d', willChange: 'transform' }`
- **Cylinder**
  - `cylinderWidth`: ~1200 (mobile ≤640px), ~1800 (desktop)
  - `radius = cylinderWidth / (2 * Math.PI)`
- **Density and face sizing**
  - `targetFaces`: 10 (mobile), 14 (desktop)
  - Densify if fewer items than `targetFaces` (duplicate items + placeholders)
  - `maxThumb`: 120 (mobile), 140 (desktop)
  - `faceWidth = min(maxThumb, cylinderWidth / max(targetFaces, 1))`
- **Face placement (each face i)**
  - Classes: `absolute flex h-full origin-center items-center justify-center rounded-2xl p-0.5`
  - Style: `{ width: faceWidth, transform: rotateY(i * (360/faceCount)) translateZ(radius) }`
- **Thumbnail card**
  - Structure: `div.relative.w-full.aspect-square` with:
    - Image: `motion.img.pointer-events-none.w-full.rounded-2xl.object-cover.aspect-square.ring-2.ring-vice-pink.shadow-[...]`
    - Overlay (top): Unit/Date badges with glass look:
      - `bg-black/40` + `backdrop-blur-sm`
      - `ring-1 ring-vice-cyan/30`
      - Rounded corners and compact padding
  - **Placeholder** (no image): `div.w-full.rounded-2xl.bg-black.ring-1.ring-vice-cyan.aspect-square`

---

## Interaction Spec
- **Drag System** (Framer Motion)
  - **ISOLATED TOUCH AREAS**: Drag is isolated to individual thumbnail cards only
  - Parent carousel container has `pointerEvents: 'none'` to prevent background/empty area dragging
  - Each card has `drag="x"` when `isCarouselActive` is true (disabled when popover is open)
  - Card drag handlers control parent rotation via shared `rotation` MotionValue
  - Sensitivity: `0.25` (mobile), `0.18` (desktop) for fine control during slow dragging
  - Velocity multiplier: `0.06` (mobile), `0.05` (desktop) for flick/momentum on release
  - Velocity threshold: `500` to distinguish between slow drag and fast flick
  - Spring physics for momentum: `stiffness: 200, damping: 28, mass: 0.5`
  - Spring physics for snap: `stiffness: 250, damping: 32, mass: 0.4`
  - `dragConstraints={{ left: 0, right: 0 }}` - no position constraints
  - `dragElastic={0}` - no elastic bounce
  - `dragMomentum={true}` - enables flick momentum
- **Click Detection**
  - Simple `onClick` handler on each card motion.div
  - Framer Motion automatically distinguishes drag vs click
  - Opens popover with full form details on click
- **Auto-rotate**
  - Slow clockwise auto-rotation while idle (0.015 speed)
  - Pauses when: popover is open, card is hovered, or carousel is offscreen (IntersectionObserver)
  - Uses `requestAnimationFrame` for smooth 60fps animation
- **Touch & Mobile**
  - `touch-pan-y` on container and parent divs to allow vertical page scrolling
  - `touchAction: 'none'` only on visible thumbnail cards to capture touch events
  - Cards outside visible angle have `pointerEvents: 'none'` and `touchAction: 'auto'`
  - Enhanced sensitivity for fine control during touch-and-hold
  - Flick support with natural momentum physics
  - Cursor: `cursor-grab active:cursor-grabbing` (shows only on cards during active state)

---

## Responsiveness
- Mobile/desktop constants selected via `useMediaQuery('(max-width: 640px)')`.
- Square thumbnails enforced by `aspect-square`.
- Carousel contained within the provided `heightClass`.

---

## Data Contract
- `forms: FormLike[]` where each form includes:
  - `id: string`
  - `unit_number: string`
  - `date?: string` (legacy MM/DD) and/or `occurred_at?: string` (ISO)
  - `photos?: string[]` (first photo used)
  - Optional: `description`, `location`, `status`, `profiles`
- Placeholders are used when `photos` is empty and to densify up to `targetFaces`.

---

## Component API
- File: `src/components/ViolationCarousel.tsx`
- Props:
  - `forms: FormLike[]` — required
  - `onDelete?: (formId: string) => void` — optional
  - `heightClass?: string` — optional; Tailwind height classes
  - `containerClassName?: string` — optional

---

## Standard Usage Pattern
- Books and Export render a single expanded carousel card with:
  - Unified Search + Time filter (This Week | This Month | All)
    - **This Week**: Past 6 days + today (7 days total)
      - Uses date normalization to ignore time components
      - Compares `formDateOnly >= startOfWeek` where both are at 00:00:00
    - **This Month**: Current calendar month (1st to last day)
      - Filters by `occurred_at` or `created_at` (fallback)
    - **All**: All saved forms
  - Count label in the card header for the selected scope
  - Carousel populated by filtered forms
  - **Important**: Date filtering normalizes timestamps to date-only (strips time) to ensure consistent filtering regardless of time zones

### Example
```
<ViolationCarousel3D
  forms={filteredForms}
  heightClass="h-[260px] sm:h-[320px]"
  containerClassName="mx-auto"
/>
```

---

## Integration Checklist
1. Map `forms` to carousel items and densify to `targetFaces`.
2. Render cylinder with perspective container and face transforms.
3. Enable pointer overlay for tight drag and snap on release.
4. Pause auto-rotate on hover/interaction/offscreen.
5. Keep overlay badges top-aligned and readable.

---

## References
- Implementation references: `src/pages/Books.tsx`, `src/pages/Export.tsx`, `src/pages/Admin.tsx`, `src/components/ViolationCarousel.tsx`

---

## App-Wide Consistency (October 18, 2025)

All three pages now use **identical filtering logic** and **consistent carousel behavior**.

### Filter Implementations

#### **Books.tsx** (Reference Implementation)
- Combined search + time filter
- Search: unit, date, violation type, location, description, user
- Time filters: This Week | This Month | All Forms
- Carousel uses `filteredForms` (search + time combined)

#### **Export.tsx** (Matches Books.tsx)
- Combined search + time filter
- Search: unit, date, violation type, location, description  
- Time filters: This Week | This Month | All Forms
- Carousel uses `filteredForms` (search + time combined)
- ✅ Removed unused `carouselForms` variable (Oct 18, 2025)

#### **Admin.tsx** (Matches Books.tsx)
- Time filter + search term
- Functions: `getThisWeekForms()`, `getThisMonthForms()`
- Carousel uses `getFilteredForms()` with delete handler
- ✅ Updated from "7 days ago" to "past 6 days + today" (Oct 18, 2025)
- ✅ Updated from "30 days ago" to "start of current month" (Oct 18, 2025)

### Consistent Filter Definitions

**This Week:**
- **Definition:** Past 6 days + today = 7 days total
- **Example:** Oct 18 shows forms from Oct 12-18 (inclusive)
- **Logic:** `startOfWeek = today - 6 days` at midnight (00:00:00)

**This Month:**
- **Definition:** From 1st of current month through today
- **Example:** Oct 18 shows forms from Oct 1-18 (inclusive)  
- **Logic:** `startOfMonth = new Date(year, month, 1)` at midnight

**All Forms:**
- No time filter applied
- Returns all forms (with search filter if active)

### Date Normalization

All pages use consistent date normalization:
```typescript
const formDate = new Date(form.occurred_at || form.created_at);
const formDateOnly = new Date(formDate.getFullYear(), formDate.getMonth(), formDate.getDate());
// Strips time component, compares dates at midnight
return formDateOnly >= startDate;
```

### Height Classes by Page

- **Books.tsx:** `h-[280px] portrait:h-[320px] landscape:h-[240px] sm:h-[280px] md:h-[320px]`
- **Admin.tsx:** `h-[320px] sm:h-[400px]`  
- **Export.tsx:** `h-[160px] sm:h-[200px]` (compact for selection focus)

### Comparison Matrix

| Feature | Books.tsx | Export.tsx | Admin.tsx |
|---------|-----------|------------|-----------|
| **This Week** | Past 6 days + today ✅ | Past 6 days + today ✅ | Past 6 days + today ✅ |
| **This Month** | Start of month ✅ | Start of month ✅ | Start of month ✅ |
| **Date Priority** | occurred_at first ✅ | occurred_at first ✅ | occurred_at first ✅ |
| **Date Normalization** | Midnight ✅ | Midnight ✅ | Midnight ✅ |
| **Touch Controls** | Isolated to cards ✅ | Isolated to cards ✅ | Isolated to cards ✅ |
| **Delete Handler** | ❌ No | ❌ No | ✅ Admin only |

### Benefits

1. **Predictable:** "This Week" means the same across all pages
2. **Maintainable:** Single source of truth for filtering logic
3. **Performant:** Consistent optimization techniques app-wide
4. **Mobile-First:** Touch controls work identically everywhere
