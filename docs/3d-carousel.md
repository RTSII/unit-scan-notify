# 3D Carousel – Unified Usage

This document summarizes the unified UI/UX standard for the 3D carousel now used on both Books and Export pages.

- Component: `ViolationCarousel3D` in `src/components/ViolationCarousel.tsx`
- Pages using it: `src/pages/Books.tsx`, `src/pages/Export.tsx`

## Standard
- Single, expanded carousel card centered on the page.
- Card header shows the current time filter label and the total forms for that scope.
- Time filter Select options: This Week | This Month | All Forms.
- Search input centered alongside the filter, consistent across pages.
- Placeholders (black squares with neon ring) fill remaining faces to keep the ring dense.
- Height can be adjusted via `heightClass` prop, e.g. `h-[260px] sm:h-[320px]`.

### Visual Overlay
- Unit and Date badges are shown at the top of each face.
- Styling: translucent glass badges with `bg-black/40`, `backdrop-blur-sm`, `ring-1 ring-vice-cyan/30`, rounded corners.

### Input/Control Smoothing
- Reduced drag sensitivity with a small deadzone to avoid jitter.
- Disabled drag momentum; gentler release spring for better control.
- Auto-rotate pauses on hover, touch start, and drag; resumes after interaction.

## Props
```
<ViolationCarousel3D
  forms={filteredForms}
  heightClass="h-[260px] sm:h-[320px]"  // optional
  containerClassName="mx-auto"         // optional
/>
```

## Data
- Expects an array of forms; each form may include `photos` (first photo is used). If missing, a placeholder is used.

## References
- Detailed spec: `docs/UI_3D_CAROUSEL_SPEC.md`
- Implementation patterns: `src/pages/Books.tsx`, `src/pages/Export.tsx`
