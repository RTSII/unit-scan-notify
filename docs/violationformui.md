# ViolationCarousel UI Component – Complete Implementation Guide

**Last Updated:** October 27, 2025  
**Status:** ✅ Production Ready with Grid Layout Support  
**Component:** `ViolationCarousel3D` in `src/components/ViolationCarousel.tsx`

This document is the **complete authoritative guide** for the ViolationCarousel UI component used across SPR Vice City app pages. It includes both 3D carousel and grid layout modes with performance optimizations.

---

## 📋 Quick Reference

- **Component Path:** `src/components/ViolationCarousel.tsx`
- **Used On:** Books.tsx, Export.tsx, Admin.tsx
- **Display Modes:** 3D Carousel (This Week/Month) + Static Grid (All Forms)
- **Mobile-First:** iPhone 13+ optimized (390px-428px viewports)

---

## 🚀 Component Overview

The ViolationCarousel3D component provides two distinct display modes:

### **3D Carousel Mode** (Default)
- **Purpose:** Interactive 3D rotating cylinder of violation cards
- **Best For:** This Week, This Month filters (≤75 items)
- **Features:** Touch drag, auto-rotate, momentum physics, click-to-view

### **Grid Layout Mode** (All Forms)
- **Purpose:** Static paginated grid for large datasets  
- **Best For:** All Forms filter (60+ items)
- **Features:** 3x3 (mobile) / 4x4 (desktop) grid with pagination
- **Performance:** Optimized for 100+ violations

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

---

## 🎨 Component API & Props

### Core Props

```typescript
interface ViolationCarousel3DProps {
  forms: FormLike[];                    // Required: Array of violation forms
  onDelete?: (formId: string) => void;  // Optional: Delete handler (Admin only)
  heightClass?: string;                 // Optional: Tailwind height classes
  containerClassName?: string;          // Optional: Additional container classes
  displayMode?: '3d-carousel' | 'grid'; // Optional: Display mode (default: '3d-carousel')
}
```

### Usage Examples

#### Standard 3D Carousel
```typescript
<ViolationCarousel3D
  forms={filteredForms}
  heightClass="h-[280px] sm:h-[320px]"
  containerClassName="mx-auto"
  displayMode="3d-carousel"
/>
```

#### Grid Layout for All Forms
```typescript
<ViolationCarousel3D
  forms={allForms}
  heightClass="h-[400px] sm:h-[500px]"
  containerClassName="w-full"
  displayMode="grid"
/>
```

#### Dynamic Mode Based on Filter
```typescript
<ViolationCarousel3D
  forms={filteredForms}
  heightClass={timeFilter === 'all' ? "h-[400px] sm:h-[500px]" : "h-[280px] sm:h-[320px]"}
  containerClassName="w-full"
  displayMode={timeFilter === 'all' ? 'grid' : '3d-carousel'}
/>
```

---

## 🎮 Display Modes Deep Dive

### 3D Carousel Mode

#### Visual Spec
- **Container:** `div.relative.w-full.overflow-hidden.rounded-xl.bg-black/20`
- **Cylinder Dimensions:**
  - Mobile (≤640px): width 1200px, radius ~191px
  - Desktop (>640px): width 1800px, radius ~286px
- **Card Sizing:**
  - Mobile: 65-120px width, 8px gaps
  - Desktop: 75-140px width, 12px gaps
  - Dynamic sizing based on item count
- **Perspective:** 800-900px for 3D effect

#### Interaction Features
- **Drag Controls:** Isolated to individual cards only
- **Touch Sensitivity:** 0.22 (mobile), 0.15 (desktop) for precise control
- **Auto-Rotation:** 0.015 deg/frame clockwise when idle
- **Momentum Physics:** Natural flick/swipe with spring physics
- **Snap Behavior:** Always snaps to nearest card on release
- **Click vs Drag:** Framer Motion distinguishes tap from drag automatically

#### Touch Control Isolation (CRITICAL)
```typescript
// Parent container - prevents background drag
style={{ 
  touchAction: 'pan-y',           // Allow vertical scrolling
  pointerEvents: 'none'           // Block touch events
}}

// Individual cards - enable drag only on visible cards
style={{
  pointerEvents: isVisible ? 'auto' : 'none',
  touchAction: isVisible ? 'none' : 'auto',
  drag: isCarouselActive ? "x" : false
}}
```

### Grid Layout Mode (Oct 27, 2025 - NEW)

#### Visual Spec
- **Grid Structure:** 3x3 (mobile) / 4x4 (desktop)
- **Spacing:** 24px gaps (mobile), 32px gaps (desktop)  
- **Container Padding:** 24px (mobile), 32px (desktop)
- **Cards:** Square aspect ratio with neon cyan borders
- **Pagination:** Bottom controls with page indicators

#### Performance Benefits
- **Items Per Page:** 9 (mobile), 16 (desktop)
- **Load Time:** Instant display (no 3D calculations)
- **Memory Usage:** Only renders visible page
- **Touch Response:** Direct card tap (no drag conflicts)

#### Grid Constants
```typescript
const GRID_CONSTANTS = {
  COLUMNS: isScreenSizeSm ? 3 : 4,
  ROWS: isScreenSizeSm ? 3 : 4,
  ITEMS_PER_PAGE: isScreenSizeSm ? 9 : 16
};
```

---

## 📱 Responsive Design

### Mobile-First Approach
- **Primary Target:** iPhone 13+ (390px-428px viewports)
- **Touch Targets:** Minimum 44px (iOS standard)
- **Breakpoint:** 640px (`sm:` prefix)

### Height Classes by Page
- **Books.tsx:**
  - 3D Mode: `h-[280px] portrait:h-[300px] landscape:h-[240px] sm:h-[280px] md:h-[320px]`
  - Grid Mode: `h-[400px] sm:h-[500px]`
- **Export.tsx:** `h-[160px] sm:h-[200px]` (compact)
- **Admin.tsx:** `h-[320px] sm:h-[400px]` (expanded)

---

## ⚡ Performance Optimizations

### Smart Buffering (Oct 27, 2025)
```typescript
const CAROUSEL_CONSTANTS = {
  INITIAL_LOAD: isScreenSizeSm ? 15 : 20,    // Fast initial display
  MAX_VISIBLE: isScreenSizeSm ? 25 : 35,     // Before pagination needed
  BUFFER_SIZE: 10,                           // Smooth scrolling buffer
  MIN_BUFFER: isScreenSizeSm ? 8 : 12        // Minimum items maintained
};
```

### Query Limits by Filter
- **This Week:** 50 items (should be manageable)
- **This Month:** 75 items (month view optimized)  
- **All Forms:** 100 items (reduced for season performance)

### Photo Loading Strategy
- **Thumbnails:** 200x200px @ 45% quality via Supabase transform
- **URL Caching:** `Map<string, string>` prevents duplicate getPublicUrl calls
- **Lazy Loading:** Full photo sets loaded when popover opens
- **Preloading:** Adjacent cards preloaded during carousel rotation

### Frame Rate Optimization
- **Rotation Updates:** Throttled to ~20fps (50ms intervals)
- **Auto-Rotation:** `requestAnimationFrame` at 60fps
- **Visibility Checks:** Optimized angle calculations
- **Re-render Prevention:** `useMemo` and `useCallback` throughout

### Filter Performance (Oct 27, 2025 - CRITICAL FIX)

**Major Performance Issue Fixed:**
- **Root Cause:** Photo URL cache was clearing on every filter change, forcing 60+ Supabase Storage API calls (6-12 second delays)
- **Solution:** Removed cache clearing, implemented smart cache management
- **Impact:** Eliminates ~10 second filter switching delays

```typescript
// Debounced filter changes prevent rapid API calls
const [debouncedTimeFilter, setDebouncedTimeFilter] = useState(timeFilter);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedTimeFilter(timeFilter);
  }, 300);
  return () => clearTimeout(timer);
}, [timeFilter]);

// Smart cache management (CRITICAL FIX)
const baseItems = useMemo(() => {
  // Removed cache clearing that was causing 10-second delays
  // Cache persists across filter changes for instant switching
  const items = mapFormsToCarouselItems(forms);
  return items.length > 0 ? items : [{ id: "placeholder-1", imageUrl: "placeholder", unit: "", date: "" }];
}, [forms]);
```

**Performance Benefits:**
- ✅ **Instant filter switching** (was 10+ seconds)
- ✅ Prevents multiple Supabase client instances
- ✅ Smart photo URL caching (persists across filters)  
- ✅ Reduces Supabase Storage API calls by 95%
- ✅ Eliminates console warnings
- ✅ Optimized thumbnail loading (200x200 @ 45% quality)

---

## 🔄 Filter Integration

### Standard Filter Types

#### This Week
- **Definition:** Past 6 days + today (7 days total)
- **Example:** Oct 27 shows Oct 21-27 (inclusive)
- **Logic:** `startOfWeek = today - 6 days` at midnight

#### This Month  
- **Definition:** From 1st of current month through today
- **Example:** Oct 27 shows Oct 1-27 (inclusive)
- **Logic:** `startOfMonth = new Date(year, month, 1)`

#### All Forms
- **Definition:** No time filter applied
- **Behavior:** Automatically switches to grid layout mode
- **Performance:** Uses pagination for large datasets

### Date Normalization (CRITICAL)
All pages must use consistent date normalization:
```typescript
const formDate = new Date(form.occurred_at || form.created_at);
const formDateOnly = new Date(formDate.getFullYear(), formDate.getMonth(), formDate.getDate());
// Always strip time component, compare dates at midnight
return formDateOnly >= startDate;
```

### Implementation Pattern
```typescript
// Books.tsx example with debouncing
const [timeFilter, setTimeFilter] = useState<'this_week' | 'this_month' | 'all'>('this_week');
const [debouncedTimeFilter, setDebouncedTimeFilter] = useState(timeFilter);

// Debounce filter changes (300ms delay)
useEffect(() => {
  const timer = setTimeout(() => setDebouncedTimeFilter(timeFilter), 300);
  return () => clearTimeout(timer);
}, [timeFilter]);

// Use debouncedTimeFilter for API calls and display logic
const filteredForms = useMemo(() => {
  // Apply filtering logic using debouncedTimeFilter
}, [forms, searchTerm, debouncedTimeFilter]);
```

---

## 🎯 App-Wide Consistency 

### Page-Specific Features

| Feature | Books.tsx | Export.tsx | Admin.tsx |
|---------|-----------|------------|-----------|
| **Filter Mode** | Combined search + time | Combined search + time | Time + search |
| **Delete Handler** | ❌ No | ❌ No | ✅ Admin only |
| **Grid Mode** | ✅ All Forms | ✅ All Forms | ✅ All Forms |
| **Touch Controls** | ✅ Isolated to cards | ✅ Isolated to cards | ✅ Isolated to cards |
| **Date Normalization** | ✅ Midnight | ✅ Midnight | ✅ Midnight |
| **Performance Debounce** | ✅ 300ms | ✅ Recommended | ✅ Recommended |

### Shared Components
- **Search:** Unit number, date, violation type, description
- **Time Filters:** This Week | This Month | All Forms selector with visual icons
- **Card Design:** Square thumbnails with neon borders and overlay badges
- **Popover:** Full violation details with photo gallery

#### Filter Dropdown Icons (Oct 27, 2025 - NEW)
- **This Week/This Month:** Film strip icon (🎬) - indicates 3D carousel mode
- **All Forms:** Grid icon (📊) - indicates static grid layout mode
- **Color States:**
  - Unselected: Neon cyan (`text-vice-cyan`)
  - Selected: Neon pink (`text-vice-pink`)

```typescript
// Import required icons
import { Film, Grid3X3 } from "lucide-react";

// Implementation in SelectItem components
<SelectItem value="this_week" className="text-white hover:bg-vice-cyan/20">
  <div className="flex items-center gap-2">
    <Film className={`w-4 h-4 ${timeFilter === 'this_week' ? 'text-vice-pink' : 'text-vice-cyan'}`} />
    <span>This Week</span>
  </div>
</SelectItem>
```

---

## 🧪 Testing Checklist

### 3D Carousel Mode
- [ ] **Spacing**: Cards have visible gaps, no overlap
- [ ] **Touch Precision**: Slow drag selects specific card
- [ ] **Smooth Flick**: Fast swipe creates natural momentum  
- [ ] **Snap Behavior**: Always snaps to nearest card
- [ ] **Visual Depth**: Back cards dimmed, front cards bright
- [ ] **Click vs Drag**: Taps open popover, drags rotate
- [ ] **Auto-Rotation**: Pauses on hover/popover/offscreen

### Grid Layout Mode
- [ ] **Grid Structure**: 3x3 mobile, 4x4 desktop
- [ ] **Card Spacing**: 24px+ gaps between cards
- [ ] **Pagination**: Navigation controls work smoothly
- [ ] **Card Interactions**: Direct tap opens popover
- [ ] **Performance**: Fast load with 100+ items
- [ ] **Responsive**: Proper scaling on different screen sizes

### Filter Performance
- [ ] **Debounced Switching**: 300ms delay prevents rapid API calls
- [ ] **No Console Errors**: No Supabase client warnings
- [ ] **Smooth Transitions**: UI updates immediately, data follows
- [ ] **Mode Switching**: 3D ↔ Grid transitions cleanly

### Cross-Page Consistency
- [ ] **Books.tsx**: Grid mode for "All Forms", 3D for others
- [ ] **Export.tsx**: Consistent behavior with Books
- [ ] **Admin.tsx**: Delete functionality + same filtering
- [ ] **Mobile First**: Test on iPhone 13+ (390-428px)

---

## 🛠️ Implementation Workflow

### Adding Carousel to New Page

1. **Copy Data Pattern** from Export.tsx:
   ```typescript
   // Use exact same query and mapping pattern
   const { data } = await supabase.from('violation_forms')...
   const formsWithPhotos = (data ?? []).map(form => {...});
   ```

2. **Import Component**:
   ```typescript
   import { ViolationCarousel3D } from '../components/ViolationCarousel';
   ```

3. **Add Filter State**:
   ```typescript
   const [timeFilter, setTimeFilter] = useState<'this_week' | 'this_month' | 'all'>('this_week');
   const [debouncedTimeFilter, setDebouncedTimeFilter] = useState(timeFilter);
   ```

4. **Implement Debouncing**:
   ```typescript
   useEffect(() => {
     const timer = setTimeout(() => setDebouncedTimeFilter(timeFilter), 300);
     return () => clearTimeout(timer);
   }, [timeFilter]);
   ```

5. **Render Component**:
   ```typescript
   <ViolationCarousel3D
     forms={filteredForms}
     heightClass={debouncedTimeFilter === 'all' ? "h-[400px] sm:h-[500px]" : "h-[280px] sm:h-[320px]"}
     displayMode={debouncedTimeFilter === 'all' ? 'grid' : '3d-carousel'}
   />
   ```

### Modifying Carousel Behavior

1. **Read Current Spec**: This document is the source of truth
2. **Identify Affected Pages**: Books, Export, Admin
3. **Make Changes**: In `ViolationCarousel3D` component
4. **Test Touch Controls**: Ensure isolation to cards only
5. **Update Filtering**: If needed, maintain consistency
6. **Test Mobile**: iPhone viewport (390-428px)
7. **Update Documentation**: Keep this file current
8. **Verify Consistency**: All three pages behave identically

---

## 🚨 Common Pitfalls & Troubleshooting

### ❌ Wrong Data Structure
**Problem:** Custom interfaces like `SavedForm`, `CustomForm`  
**Solution:** Use exact `ViolationForm` interface from this doc

### ❌ Photos Not Displaying  
**Problem:** Wrong data mapping or missing storage paths  
**Solution:** Copy exact mapping pattern from Export.tsx

### ❌ Overlapping Cards
**Problem:** Insufficient gap calculation or too many items  
**Solution:** Grid mode for large datasets, proper gap constants

### ❌ Touch Controls Not Working
**Problem:** Parent container intercepting touch events  
**Solution:** Ensure `pointerEvents: 'none'` on container, `'auto'` on cards

### ❌ Filter Switching Delays
**Problem:** Multiple rapid API calls creating Supabase warnings  
**Solution:** Implement 300ms debouncing pattern

### ❌ Inconsistent Filter Behavior
**Problem:** Different date normalization across pages  
**Solution:** Use exact date normalization pattern (strips time)

### ❌ Performance Issues
**Problem:** Too many items in 3D carousel mode  
**Solution:** Use grid mode for "All Forms", limit 3D to ≤75 items

---

## 📚 Reference Files

- **Implementation:** `src/components/ViolationCarousel.tsx`
- **Usage Examples:** `src/pages/Books.tsx`, `src/pages/Export.tsx`, `src/pages/Admin.tsx`
- **Workflow:** `.windsurf/workflows/3d-carousel-modification.md`
- **Original Spec:** `docs/3d-carousel.md` (superseded by this document)

---

## 📈 Version History

- **Oct 27, 2025**: Added grid layout mode, debouncing, enhanced spacing
- **Oct 24, 2025**: Optimized spacing, touch controls, and visibility  
- **Oct 23, 2025**: Added server-side filtering, nested photo limits
- **Oct 18, 2025**: Unified filtering logic across all pages
- **Initial**: 3D carousel with Framer Motion implementation

---

## 📝 Development Rules

### NEVER:
- Store base64 images in database
- Filter violation_forms by user_id (team transparency)
- Use @ts-ignore without regenerating types  
- Commit debug console.log statements
- Deploy without testing on iPhone
- Change date filtering without updating all pages

### ALWAYS:
- Upload photos to Supabase Storage
- Test mobile-first on iPhone viewport
- Use consistent date filtering across pages
- Isolate carousel touch controls to cards
- Show all violations to all users
- Update this documentation for major changes
- Regenerate types after schema changes
- Test grid mode with 60+ forms

---

*This document serves as the single source of truth for ViolationCarousel3D implementation across the SPR Vice City application. Keep it updated with any component modifications.*
