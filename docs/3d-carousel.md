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
  - `div.relative.h-[200px].w-full.overflow-hidden.rounded-xl.bg-black/20`
  - Pages may pass a taller height via `heightClass`:
    - Mobile: `h-[240px]–h-[260px]`
    - Desktop: `h-[300px]–h-[320px]`
  - Inner wrapper with perspective and 3D preservation:
    - `div.flex.h-full.items-center.justify-center.bg-black/10`
    - Inline style: `{ perspective: 700–1000px, transformStyle: 'preserve-3d', willChange: 'transform' }`
- **Cylinder**
  - `cylinderWidth`: ~1500 (mobile ≤640px), ~2000 (desktop)
  - `radius = cylinderWidth / (2 * Math.PI)`
- **Density and face sizing**
  - `targetFaces`: 12 (mobile), 16 (desktop)
  - Densify if fewer items than `targetFaces` (duplicate items + placeholders)
  - `maxThumb`: 64 (mobile), 120 (desktop)
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
- **Grip and drag**
  - Per-card absolute pointer overlay captures pointer events for tight scrubbing.
  - Small deadzone filters jitters; horizontal deltas rotate the cylinder with low sensitivity.
  - Tiny moves (< few px) are treated as clicks to open the popover.
- **Snapping**
  - On release, rotation snaps to the nearest `360/faceCount` step.
  - Spring config tuned for quick settle without overshoot.
- **Auto-rotate**
  - Slow clockwise auto-rotation while idle.
  - Pauses on hover, touch/drag interaction, and when the carousel is offscreen (IntersectionObserver).
- **Touch ergonomics**
  - `touch-pan-y` on the container to mitigate vertical scroll conflicts.
  - Cursor feedback: hand/grab cursors on each card for affordance.

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
  - Count label in the card header for the selected scope
  - Carousel populated by filtered forms

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
