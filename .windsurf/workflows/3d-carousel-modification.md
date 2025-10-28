---
description: 3D Carousel Modification
auto_execution_mode: 3
---

Name: SPR Vice City - Carousel Update
Trigger: When modifying carousel behavior

Steps:
1. Read **docs/3D-CAROUSEL-STANDARD.md** for current spec (SINGLE SOURCE OF TRUTH)
2. Identify affected pages (Books, Export, Admin)
3. Make changes to ViolationCarousel3D component
4. Ensure touch controls isolated to cards (pointerEvents pattern)
5. Update filtering logic if needed (verify occurred_at priority)
6. Verify data contract compliance (NO profiles FK join)
7. Test on iPhone (touch/swipe/flick/momentum)
8. Update **docs/3D-CAROUSEL-STANDARD.md** with changes
9. Update CHANGELOG.md with version and details
10. Verify consistency across all three pages
11. Commit and deploy (auto-deploy from GitHub)
12. Test on production iPhone (Safari AND Chrome)

Important Notes:
- 3D-CAROUSEL-STANDARD.md is the ONLY carousel doc to reference/update
- Old docs (3d-carousel.md, CAROUSEL_REVIEW_OCT25.md, CAROUSEL_IMPLEMENTATION_SUMMARY.md) are deprecated
- Always test photo display - check for broken FK joins
- Verify This Month filter shows correct count