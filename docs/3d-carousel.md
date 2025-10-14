# 3D Carousel – Unified Spec and Usage

This single document is the authoritative spec and usage guide for the 3D carousel used on Books and Export. It supersedes the previous separate spec file.

- **Component**: `ViolationCarousel3D` in `src/components/ViolationCarousel.tsx`
- **Pages**: `src/pages/Books.tsx`, `src/pages/Export.tsx`

---

## Purpose
- **Dense ring** of square, rounded thumbnail cards with minimal spacing.
- **Continuous drag/rotate** experience with an “infinite” feel and snapping for control.
- **Readable overlay**: Unit and Date on each thumbnail with glass-style badges.
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
  - Uses Framer Motion's built-in `drag="x"` prop for smooth, physics-based dragging
  - Drag only active when `isCarouselActive` is true (disabled when popover is open)
  - Sensitivity: `0.15` for fine control during slow dragging
  - Velocity multiplier: `0.08` for flick/momentum on release
  - Spring physics: `stiffness: 120, damping: 25, mass: 0.15`
  - `dragConstraints={{ left: 0, right: 0 }}` - no position constraints
  - `dragElastic={0}` - no elastic bounce
  - `dragMomentum={true}` - enables flick momentum
- **Click Detection**
  - Simple `onClick` handler on each card div
  - Framer Motion automatically distinguishes drag vs click
  - Opens popover with full form details on click
- **Auto-rotate**
  - Slow clockwise auto-rotation while idle (0.015 speed)
  - Pauses when: popover is open, card is hovered, or carousel is offscreen (IntersectionObserver)
  - Uses `requestAnimationFrame` for smooth 60fps animation
- **Touch & Mobile**
  - `touch-pan-y` on container to allow vertical scrolling
  - Enhanced sensitivity (0.15) for fine control during touch-and-hold
  - Flick support with natural momentum physics
  - Cursor: `cursor-grab active:cursor-grabbing` (shows only during active drag)

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
- Implementation references: `src/pages/Books.tsx`, `src/pages/Export.tsx`, `src/components/ViolationCarousel.tsx`
