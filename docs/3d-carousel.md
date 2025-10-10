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
