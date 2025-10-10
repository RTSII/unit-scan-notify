# 3D Carousel UI Spec (Unified Books/Export)

This document defines the canonical visual and behavioral spec for the 3D carousel used across this project. As of this update, the unified reference look-and-feel lives on `src/pages/Books.tsx` and `src/pages/Export.tsx` using `ViolationCarousel3D`.


## Purpose
- Display a dense ring of square, rounded thumbnail cards with minimal spacing.
- Provide a continuous drag/rotate experience (feels infinite).
- Overlay Unit and Date in neon cyan inside each thumbnail.
- Maintain strict responsiveness and containment in a short track (140px).


## Visual Spec
- Container
  - Default card container (Books/Export): `div.relative.h-[200px].w-full.overflow-hidden.rounded-xl.bg-black/20`
  - Export/Books can pass a taller height via the component prop (see Component API). Typical heights:
    - Mobile: `h-[240px]–h-[260px]`
    - Desktop: `h-[300px]–h-[320px]`
  - Inner wrapper with perspective and 3D preservation:
    - `div.flex.h-full.items-center.justify-center.bg-black/10`
    - Inline style: `{ perspective: '1000px', transformStyle: 'preserve-3d', willChange: 'transform' }`
- Cylinder dimensions
  - `cylinderWidth`: ~1400 (mobile ≤640px), ~2000 (desktop)
  - `radius = cylinderWidth / (2 * Math.PI)`
- Density and face sizing
  - `targetFaces`: 12 (mobile), 16 (desktop)
  - Densification: If there are fewer items than `targetFaces`, duplicate items and include placeholders to reach `targetFaces`.
  - `maxThumb`: 80 (mobile), 120 (desktop)
  - `faceWidth = min(maxThumb, cylinderWidth / max(targetFaces, 1))`
- Face placement (for each face i)
  - Face element classes: `absolute flex h-full origin-center items-center justify-center rounded-2xl p-0.5 sm:p-1`
  - Style per-face: `{ width: faceWidth, transform: rotateY(i * (360/faceCount)) translateZ(radius) }`
- Thumbnail card
  - Structure:
    - `div.relative.w-full.aspect-square` containing:
      - `motion.img.pointer-events-none.w-full.rounded-2xl.object-cover.aspect-square.ring-2.ring-vice-pink.shadow-[0_0_12px_#ff1493,0_0_24px_#ff149350]`
      - Neon cyan overlay (bottom center, stacked):
        - `div.absolute.inset-x-0.bottom-0.flex.flex-col.items-center.justify-center.gap-1.pb-2`
        - Date: `text-xs font-semibold text-vice-cyan bg-black/90 rounded px-2 py-1`
        - Unit: `text-sm font-bold text-vice-cyan bg-black/90 rounded px-2 py-1`
  - Placeholder card (no image):
    - `div.w-full.rounded-2xl.bg-black/70.ring-1.ring-vice-pink/50.shadow-[0_0_6px_#ff149380,0_0_10px_#00ffff60].aspect-square`


## Interaction Spec
- Drag/rotate
  - `drag="x"` when carousel is active; disabled when a thumbnail is opened in the modal.
  - onDrag: `rotation.set(rotation.get() + info.offset.x * 0.05)`
  - onDragEnd: spring to add momentum
    - `{ type: 'spring', stiffness: 100, damping: 30, mass: 0.1 }`
- Infinite feel
  - The cylinder itself is continuous; densification ensures the ring always looks well-populated so gaps are not noticeable even with few items.
- Modal preview
  - `AnimatePresence` with `motion.img` using a unique `layoutId` per item index, e.g. `img-${imageUrl}-${index}`
  - Clicking a thumbnail sets `activeImg` and `activeIndex`, disables drag; clicking backdrop closes.


## Responsiveness
- Use `useMediaQuery('(max-width: 640px)')` to choose mobile/desktop constants.
- Square thumbnails enforced by `aspect-square` + `w-full` (no `h-full`).
- Container stays at `h-[200px]` by default with `overflow-hidden` to avoid bleed and can be overridden by props.


## Unified single-card usage (Books/Export)
- Books and Export now display a single, expanded carousel card.
- The card header shows the current time filter label (This Week, This Month, All Forms) and the total form count for that scope.
- The carousel always displays items for the selected time scope. Placeholders (black squares with neon ring) are used to fill remaining faces.


## Data contract
- Component expects `forms: SavedForm[]` where each form includes:
  - `id: string`
  - `unit_number: string`
  - `date: string` (ISO; will be formatted)
  - `photos: string[]` (first photo used as thumbnail)
  - Optional `description` (not shown on face) and `status` etc.
- If a form lacks photos, a placeholder face is shown. Placeholders are also used to densify the ring.

## Component API (ViolationCarousel3D)
- File: `src/components/ViolationCarousel.tsx`
- Props:
  - `forms: FormLike[]` — required
  - `onDelete?: (formId: string) => void` — optional
  - `heightClass?: string` — optional; Tailwind height classes to override default height
  - `containerClassName?: string` — optional; additional classes on outer container

## Time filter pattern
- Pages using the carousel should provide a time filter Select (`this_week | this_month | all`) and map it to the forms collection prior to rendering `ViolationCarousel3D`.
- See: `src/pages/Books.tsx`, `src/pages/Export.tsx` for reference.


## Integration Checklist
1. Import utilities
   - `useMediaQuery` from `src/components/ui/3d-carousel`.
   - Framer Motion: `AnimatePresence, motion, useAnimation, useMotionValue, useTransform`.
2. Prepare items
   - Map `forms` to items `{ id, imageUrl, unit, date }`.
   - Densify to `targetFaces` by duplicating items or placeholders.
3. Render container and cylinder per Visual Spec.
4. Render faces
   - Use `p-0.5 sm:p-1` for subtle inter-card spacing.
   - Use square, rounded thumbnails with ring/shadow.
   - Add the neon cyan overlay with Unit and Date.
5. Handle interactions
   - Drag + spring momentum as above.
   - Unique `layoutId` per face: `img-${imageUrl}-${index}`.
   - Toggle `isCarouselActive` when opening/closing modal.
6. Containment
   - Keep the carousel inside a 140px-high container with `overflow-hidden`.
7. Sections behavior (if applicable)
   - Ensure only one collapsible section is open at a time.
   - Implement click-outside collapse for the entire violations block.
   - **Implement Active Section Positioning**: Add conditional CSS classes to move expanded sections to the top:
     - Wrap each section in a container with dynamic `order-first` class when expanded
     - Example: `<div className={`w-full ${isExpanded ? 'order-first' : ''}`}>`
   - Ensure smooth transitions when sections reorder.


## File references
- `src/pages/Books.tsx` — unified single-card usage with time filter.
- `src/pages/Export.tsx` — unified single-card usage with time filter.
- `src/components/ViolationCarousel.tsx` — primary implementation.
- `src/components/ui/3d-carousel.tsx` — `useMediaQuery` hook.


## Theming
- Neon cyan / pink accents rely on Tailwind theme tokens (e.g., `text-vice-cyan`, `ring-vice-cyan`, `ring-vice-pink`). Ensure these exist in the Tailwind config.


## Optional extensions
- Autoplay idle rotation (slow, paused on drag/hover).
- Configurable `targetFaces` and sizes via props.
- Toggle overlay on/off via prop if thumbnails must be clean.

