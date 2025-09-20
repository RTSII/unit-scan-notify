# 3D Carousel UI Spec (Admin Style)

This document defines the canonical visual and behavioral spec for the 3D carousel used across this project. The implementation in `src/pages/Admin.tsx` is the reference look-and-feel. Apply this spec anywhere a 3D carousel is requested.


## Purpose
- Display a dense ring of square, rounded thumbnail cards with minimal spacing.
- Provide a continuous drag/rotate experience (feels infinite).
- Overlay Unit and Date in neon cyan inside each thumbnail.
- Maintain strict responsiveness and containment in a short track (140px).


## Visual Spec
- Container
  - `div.relative.h-[140px].w-full.overflow-hidden.rounded-xl.bg-black/20`
  - Inner wrapper with perspective and 3D preservation:
    - `div.flex.h-full.items-center.justify-center.bg-black/10`
    - Inline style: `{ perspective: '1000px', transformStyle: 'preserve-3d', willChange: 'transform' }`
- Cylinder dimensions
  - `cylinderWidth`: 1100 (mobile ≤640px), 1800 (desktop)
  - `radius = cylinderWidth / (2 * Math.PI)`
- Density and face sizing
  - `targetFaces`: 16 (mobile), 22 (desktop)
  - Densification: If there are fewer items than `targetFaces`, duplicate items/placeholders to reach `targetFaces`.
  - `maxThumb`: 64 (mobile), 80 (desktop)
  - `faceWidth = min(maxThumb, cylinderWidth / targetFaces)`
- Face placement (for each face i)
  - Face element classes: `absolute flex h-full origin-center items-center justify-center rounded-2xl p-0.5 sm:p-1`
  - Style per-face: `{ width: faceWidth, transform: rotateY(i * (360/faceCount)) translateZ(radius) }`
- Thumbnail card
  - Structure:
    - `div.relative.w-full.aspect-square` containing:
      - `motion.img.pointer-events-none.w-full.rounded-2xl.object-cover.aspect-square.ring-1.ring-vice-cyan/40.shadow-[0_0_6px_#00ffff40,0_0_12px_#ff149340]`
      - Neon cyan overlay (bottom-left, stacked):
        - `div.absolute.inset-x-1.bottom-1.flex.flex-col.items-start.gap-0.5`
        - Top line: `Unit {unit}` → `text-[10px] sm:text-xs font-semibold text-vice-cyan drop-shadow-[0_0_2px_#00ffff]`
        - Bottom line: `{date}` → `text-[10px] sm:text-xs text-vice-cyan/90 drop-shadow-[0_0_2px_#00ffff]`
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
- Container stays at `h-[140px]` with `overflow-hidden` to avoid bleed.


## Behavior in Sections (Admin reference)
- When used in multiple collapsible sections (e.g., This Week, This Month):
  - Only one section may be expanded at a time.
  - Clicking outside of the violations area collapses all.
  - **Active Section Positioning**: When a section is expanded, it automatically moves to the top position within the sections container for improved visibility and user experience.
  - **Dynamic Reordering**: Use CSS flexbox `order-first` class on the expanded section's container to move it to the top of the flex column.
  - **Return to Default**: When collapsed or when another section becomes active, sections return to their natural order.
- Reference: see `src/pages/Admin.tsx` — `AdminViolationCarousel` and the surrounding expand/collapse logic.


## Data contract
- Component expects `forms: SavedForm[]` where each form includes:
  - `id: string`
  - `unit_number: string`
  - `date: string` (ISO; will be formatted)
  - `photos: string[]` (first photo used as thumbnail)
  - Optional `description` (not shown on face) and `status` etc.
- If a form lacks photos, a placeholder face is shown.


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
- `src/pages/Admin.tsx` — authoritative reference (`AdminViolationCarousel`).
- `src/pages/Books.tsx` — same visual and behavior after recent updates.
- `src/components/ui/3d-carousel.tsx` — `useMediaQuery` and base carousel utilities.


## Theming
- Neon cyan / pink accents rely on Tailwind theme tokens (e.g., `text-vice-cyan`, `ring-vice-cyan`, `ring-vice-pink`). Ensure these exist in the Tailwind config.


## Optional extensions
- Autoplay idle rotation (slow, paused on drag/hover).
- Configurable `targetFaces` and sizes via props.
- Toggle overlay on/off via prop if thumbnails must be clean.

