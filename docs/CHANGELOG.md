# SPR Vice City - Changelog

All notable changes to the SPR Vice City project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.0] - 2025-10-23

### 🎯 **New Feature - IDE Preview Toggle**

Added interactive device preview toggle to Dashboard.tsx for responsive design testing directly in Windsurf IDE.

### ✨ **Added**
- **Device Preview Toggle**: Three-option toggle (Mobile/Tablet/Desktop) positioned below Siri Orb with liquid glass styling
- **IDE Viewport Control**: Toggle actually adjusts browser viewport dimensions for realistic responsive testing
- **Visual Feedback**: 
  - Liquid glass badge with Vice City gradient background
  - Active state indicator with animated gradient
  - Current dimension display above toggle (iPhone 13, iPad Pro, Desktop)
  - Smooth transitions between preview modes
- **Mobile-First Testing**: Direct viewport manipulation for accurate mobile/tablet/desktop preview
  - Mobile: 390px (iPhone 13 width)
  - Tablet: 834px (iPad Pro width)
  - Desktop: Full browser width

### 🎨 **UI Improvements**
- **Liquid Glass Effect**: Enhanced backdrop blur with gradient overlay for premium glass morphism
- **Vice City Styling**: Cyan → Purple → Pink gradient active states
- **Positioning**: Centered below Siri Orb (80px offset) for optimal UX
- **Responsive Icons**: Smartphone, Tablet, and Monitor icons with proper scaling

### 🔧 **Technical Implementation**
- **DOM Manipulation**: Direct `document.documentElement` and `document.body` style modification
- **Viewport Constraints**: CSS `maxWidth`, `margin: 0 auto`, and `overflow: auto` for proper centering
- **Cleanup Logic**: Automatic removal of constraints on component unmount
- **State Management**: React useEffect with previewMode dependency for immediate updates

### 📱 **Development Workflow Enhancement**
- **Instant Responsive Testing**: No need to resize browser manually or use external tools
- **Accurate Device Simulation**: Real viewport constraints matching actual device dimensions
- **Visual Mode Indicator**: Always-visible current mode display for team collaboration
- **Smooth Transitions**: 500ms ease-out animations for professional feel

## [3.2.4] - 2025-10-18

### 🔧 **Critical Fixes**
- **Books Carousel Data Contract**: Fixed 500 database error and missing thumbnails in Books.tsx
  - **Root cause**: Books.tsx used custom query (specific columns) and custom interface (SavedForm) instead of Export.tsx pattern
  - **Solution**: Unified data fetching across all pages using Export.tsx pattern:
    - Changed query from specific columns to `SELECT *` with joins
    - Replaced SavedForm interface with ViolationForm interface (matching Export.tsx)
    - Removed custom `normalizeViolationForm()` function
    - Implemented Export.tsx data mapping pattern directly
  - **Result**: Books.tsx now displays thumbnails correctly, matching Export.tsx behavior
  - Added `getPhotoUrl()` helper in ViolationCarousel.tsx to handle both storage paths and full URLs
  - **Documentation**: Updated `docs/3d-carousel.md` with critical "Data Contract" section to prevent future mismatches

### ⚡ **Performance Optimizations**
- **Carousel Thumbnail Loading**: Implemented Supabase image transformations for faster carousel performance
  - Thumbnails now load at 300x300px, 60% quality (10-20x smaller file size)
  - Added `loading="lazy"` and `decoding="async"` attributes for optimized loading
  - Stabilized layout with fixed aspect-ratio containers to prevent jumping/glitching
  - Added dark background placeholder while images load
  - Popover displays full-quality images (no compression)
  - **Result**: Eliminates layout thrashing on iPhone Safari, dramatically faster carousel scrolling

- **Mobile Carousel Sizing & Layout**: Optimized iPhone display for maximum carousel space
  - Reduced mobile card size from 120px to 90px
  - Increased mobile carousel height from 220px to 300px portrait (36% larger)
  - Optimized cylinder radius: 1400px for balanced spacing (no overlapping, not too far apart)
  - Increased perspective from 600px to 900px for less 3D distortion
  - Minimized parent card padding: header (pb-2→pb-1, pt-3, px-4), content (pt-2, pb-2, px-2)
  - Removed unnecessary nested divs that wasted space
  - Reduced carousel wrapper padding (py-1→removed, px-4→px-2)
  - Increased card min-height from 60vh to 65vh
  - **Result**: Carousel dominates mobile screen with 3+ cards visible, tight spacing, minimal wasted space

### 🎨 **UI Improvements**
- **Carousel Badge Readability**: Updated date/unit badges with liquid glass effect
  - Changed background from `bg-black/50` to `bg-white/10` with `backdrop-blur-md`
  - Updated border from pink to white (`ring-white/30`) for better contrast
  - Added `shadow-lg` and increased glow intensity
  - **Result**: C3F, 10/05, and other labels are now clearly readable over any photo background

### 📚 **Documentation**
- **3d-carousel.md**: Added ⚠️ CRITICAL section with:
  - Required ViolationForm interface
  - Required database query pattern (Export.tsx as reference)
  - Required data mapping pattern
  - DON'T DO list of common mistakes
  - Clear explanation of why consistency matters

---

## [3.2.3] - 2025-10-18

### 🔧 **Critical Fixes**
- **Photo Storage**: Fixed DetailsLive.tsx to upload photos to Supabase Storage instead of storing base64 in database
  - Added client-side image compression (1600px max, 80% quality JPEG)
  - Upload to `violation-photos` storage bucket
  - Store storage paths instead of full URLs or base64 data
  - Matches DetailsPrevious.tsx implementation
  - Eliminates database bloat from multi-MB base64 strings

### 🎡 **3D Carousel Unification**
- **Consistent Filtering**: Unified date filtering logic across Books, Export, and Admin pages
  - "This Week" filter now consistently shows "past 6 days + today" (7 days total) across all pages
  - "This Month" filter shows forms from 1st of current month onward (not 30 days ago)
  - Date normalization to midnight for accurate comparisons
  - All pages prioritize `occurred_at` over `created_at` consistently
- **Code Cleanup**: Removed unused `carouselForms` variable from Export.tsx
- **Touch Controls**: Verified touch isolation to thumbnail cards only (no background dragging)

### 📚 **Documentation**
- Updated `docs/3d-carousel.md` with App-Wide Consistency section
- Created `docs/PHOTO_STORAGE_FIX.md` with comprehensive fix documentation
- Updated `README.md` with October 18 improvements
- Updated `WORKFLOW_REVIEW.md` with recent fixes

### 🗄️ **Database**
- `violation_photos.storage_path` now stores: `{user_id}/{filename}.jpg` format
- Legacy base64 data filtered out automatically in Books.tsx
- No migration required - existing data continues to work

---

## [3.2.2] - 2025-10-12

### 📚 Documentation
- Unified 3D carousel documentation: `docs/3d-carousel.md` is now the single authoritative spec and usage guide.
- Clarified that `docs/UI_3D_CAROUSEL_SPEC.md` is superseded by `docs/3d-carousel.md`.

### 🎡 UI/Interaction
- 3D carousel control improvements:
  - Per-card pointer overlay for tighter grip/scrub
  - Snap-to-nearest-face on release
  - Reduced mobile faces for better control (12 mobile / 16 desktop)
  - Disabled drag momentum with gentler spring
  - Offscreen pause via IntersectionObserver

### 🗄️ Database
- Added FK migration: `violation_photos.violation_id → violation_forms.id (ON DELETE CASCADE)` to ensure nested joins work reliably.

---

## [3.2.1] - 2025-10-10

### UI & Search Enhancements
- Integrated Search + Filter UI on `Books.tsx` and `Export.tsx` into a single unified component.
- Widened filter control to ensure full option titles are visible across breakpoints.
- Enhanced search semantics to match Unit #’s, Dates (legacy `date` and `occurred_at` in multiple formats), and normalized Violation types.
- 3D carousel on Export now reflects filtered results while maintaining placeholder density.

## [3.2.0] - 2025-10-10

### UI Unification
- Books and Export now share a unified, single-card 3D carousel layout.
- Card headers show the current time filter label (This Week | This Month | All Forms) and total form count.
- Search and Filter menus centered and consistent across both pages.

### Behavior Changes
- Removed Books page collapsible sections (This Week/This Month) in favor of a single time-filter-driven carousel.
- Placeholders auto-fill the carousel to maintain a dense ring, matching Export behavior.

### Component Updates
- `ViolationCarousel3D` now supports `heightClass` and `containerClassName` props for flexible sizing.

### Documentation
- Updated `docs/UI_3D_CAROUSEL_SPEC.md` to reflect the unified standard and new props.
- Added `docs/3d-carousel.md` with quick-start usage for unified Books/Export pattern.
- Updated docs index references where applicable.
This release introduces morphing popover components for Description and Photos sections, auto-formatting for date/time inputs, and improved unit validation with visual feedback.

### ✨ **Added**
- **Morphing Popover Components**: Replaced static Description and Photos sections with interactive morphing popovers
- **Auto-Formatting Inputs**: Date field automatically formats as MM/DD, Time field formats as HH:MM
- **Mobile Keyboard Optimization**: Date and Time inputs trigger numeric keyboard on mobile devices
- **Unit Validation System**: Real-time unit validation with visual feedback (green checkmark/red X)
- **Enhanced Photo Management**: Improved photo selection and preview within morphing popover
- **Interactive Description Field**: Textarea-based description input with Back/Save functionality

### 🎨 **Changed**
- **Form Field Structure**: Updated unit field to use `unit_number` consistently across the application
- **Input Validation**: Enhanced form validation to include unit validity checks
- **Mobile UX**: Improved touch interactions and visual feedback for mobile users
- **Component Architecture**: Refactored DetailsPrevious.tsx with cleaner component structure

### 🔧 **Fixed**
- **Import Path Issues**: Corrected useAuth import path from '@/hooks/useAuth'
- **Component Dependencies**: Fixed morphing-popover import path to use core components
- **Type Safety**: Improved TypeScript type definitions for form data structure
- **State Management**: Cleaned up unused state variables and imports
- **DetailsLive Save Flow (Oct 9)**: Added `occurred_at` to insert payload and replaced invalid `.returns<...>()` with `.single()` on Supabase insert to reliably create the form before inserting photos


## [2.1.5] - 2025-09-09

### 🚀 **FEATURE RELEASE - Dashboard Redesign & Enhanced Navigation**

This release focuses on a complete redesign of the dashboard with a vertically centered Siri Orb navigation hub and enhanced Books page with improved 3D carousel functionality.

### ✨ **Added**
- **Dashboard Redesign**: Vertically centered Siri Orb as the primary navigation hub
- **User Avatar Integration**: Added user avatar in top-right corner with sign-out functionality
- **3D Carousel Enhancements**: Improved Books.tsx carousel with Vice City styled thumbnails and optimized sizing
- **Single Card Expansion**: Only one card expands at a time in Books.tsx with click-outside collapse functionality

### 🎨 **Changed**
- **Navigation Layout**: Moved Siri Orb from bottom to center of screen for better visual balance
- **Button Arc Configuration**: Changed 4-button menu from bottom arc to semi-circle around centered orb
- **Vice City Styling**: Enhanced all new UI elements with authentic Vice City color palette
- **Background Update**: Switched dashboard background from 2.jpeg to 2.png for better quality
- **Thumbnail Design**: Changed carousel thumbnails to black screens with glowing Vice City borders

### 🔧 **Fixed**
- **Mobile Responsiveness**: Ensured all new dashboard elements work across all device sizes
- **Click-Outside Handling**: Improved click-outside detection for user menu and expanded cards
- **Performance Optimization**: Optimized carousel container sizing for better mobile performance


## [2.1.4] - 2025-09-08


## [2.1.4] - 2025-09-08

### 🚀 **FEATURE RELEASE - UI Enhancement & Texture Components**

This release focuses on enhancing the user interface with new TextureCard components and improved header layouts for better visual design and user experience.

### ✨ **Added**
- **Texture Card Components**: Implemented custom TextureCard UI components with gradient backgrounds and subtle patterns
- **Manual Component Creation**: Created texture-card component manually since shadcn installation had issues
- **Component Directory Structure**: Added `src/components/ui/texture-card/` with index.ts and index.tsx files

### 🎨 **Changed**
- **Header Improvements**: Centered "Details" title with home button icon positioning in both DetailsLive.tsx and DetailsPrevious.tsx
- **UI Styling Updates**: Changed TextureCard background to black for improved contrast and aesthetics
- **Form Wrapping**: Wrapped form content in both Details components with TextureCard components
- **Visual Consistency**: Enhanced visual design across both Details forms with consistent styling

### 🔧 **Fixed**
- **Import Issues**: Resolved import path issues in texture card component by inlining the `cn` function
- **TypeScript Errors**: Fixed type errors in DetailsPrevious.tsx related to Supabase error handling
- **Component Integration**: Ensured proper integration of TextureCard components without breaking existing functionality

## [2.1.3] - 2025-09-08

### 🚀 **FEATURE RELEASE - Camera Improvements**

This release focuses on improving the camera functionality for mobile devices, particularly iOS devices, with better compatibility and proper rear camera handling.

### ✨ **Added**
- **Rear Camera Priority**: Camera now tries to use the rear camera (environment) first for violation documentation
- **No Mirroring for Rear Camera**: Rear camera feed and captured images are no longer mirrored for accurate documentation
- **Enhanced iOS Compatibility**: Simplified camera constraints that work better on iOS devices

### 🔧 **Fixed**
- **Camera Access Issues**: Improved camera access with multiple fallback constraints for different device capabilities
- **Error Handling**: More detailed error messages for different types of camera access failures
- **Debugging**: Additional console logs to help troubleshoot camera issues

### 🎨 **Changed**
- **Camera Component**: Completely refactored CameraCapture.tsx with better error handling and device compatibility
- **Camera Constraints**: Updated constraints to prioritize rear camera with multiple fallback options

## [2.1.2] - 2025-09-08

### 🚀 **FEATURE RELEASE - UI/UX Enhancements**

This release focuses on improving the user interface and experience for the Details Previous page with enhanced visual elements and better field sizing.

### ✨ **Added**
- **Morphing Buttons**: Implemented morphing Description and Photos buttons with smooth animations
- **Exclusive Expansion**: Only one section (Description or Photos) can be expanded at a time
- **Enhanced Visual Effects**: Added subtle glow effects and smooth transitions for button interactions
- **Accessibility Improvements**: Added proper aria labels and semantic HTML structure

### 🎨 **Changed**
- **Field Sizing**: Adjusted Date, Time, and Unit field widths for better content accommodation
- **Text Alignment**: Centered text in all input fields for improved visual consistency
- **Header Update**: Changed title from "Details Previous" to "Details" with improved home icon positioning
- **Photo Grid Layout**: Updated photo grid to show one card with stylized add image icon, expanding to 2x2 grid

## [2.1.1] - 2025-09-08

### 🚀 **OPTIMIZATION RELEASE - Image Optimization & Repository Cleanup**

This release focuses on optimizing the application's assets and cleaning up the repository to improve performance and maintainability.

### ✨ **Added**
- **Repository Cleanup**: Removed unused images and files, saving approximately 8.7MB
- **Git Configuration**: Updated `.gitignore` to exclude `bun.lockb` and `.bolt/` directories

### 🎨 **Changed**
- **Image Optimization**: Optimized SPR logo (`vicecity.png`) from 297KB to 58KB (80% reduction)
- **Performance Improvements**: Improved loading performance on mobile devices

## [2.1.0] - 2025-01-15

### 🚀 **MAJOR RELEASE - Admin Panel & Database Management**

This release introduces a comprehensive admin panel with team statistics, user activity tracking, and professional database management capabilities.

### ✨ **Added**
- **Full Admin Dashboard**: Complete admin panel with team statistics, user activity tracking, and violation management
- **Supabase CLI Integration**: Local CLI setup with custom migration helpers for professional database management
- **Team Transparency**: All users can now view all violations while maintaining edit restrictions
- **User Activity Tracking**: Real-time monitoring of user actions and form completions
- **Team Performance Metrics**: Comprehensive statistics and performance indicators

### 🔧 **Fixed**
- **Authentication Issues**: Fixed critical authentication issues and improved user experience
- **Database Migrations**: Comprehensive migration system with automated admin policies and user activity tracking

### 🎨 **Changed**
- **Admin Policies**: Dedicated admin access to all data with proper security boundaries
- **Row Level Security (RLS)**: Complete security implementation with role-based access control

## [2.0.1] - 2025-01-10

### 🚀 **PATCH RELEASE - Mobile Optimization & UI Fixes**

This release focuses on mobile optimization and UI fixes to improve the user experience on iPhone devices.

### ✨ **Added**
- **iPhone Responsive Design**: Comprehensive mobile optimizations for iPhone 13 to current generation iPhones
- **Safe Area Support**: Proper handling of device notches and home indicators
- **Touch-Friendly Interface**: Minimum 44px touch targets for iOS accessibility compliance

### 🔧 **Fixed**
- **Viewport Issues**: Fixed viewport configuration and meta tags for better mobile display
- **UI Alignment**: Improved centering and responsive containers for better mobile experience

### 🎨 **Changed**
- **Mobile-First Approach**: Enhanced mobile-first design principles throughout the application

## [2.0.0] - 2025-01-05

### 🚀 **MAJOR RELEASE - Production Ready Application**

This release marks the production-ready version of SPR Vice City with all core features implemented and thoroughly tested.

### ✨ **Added**
- **Core Functionality**: Complete mobile violation management system with photo capture and form submission
- **User Authentication**: Secure invite-only registration system with role-based access
- **Data Export**: Email and print export capabilities for violation notices
- **Books Library**: Searchable archive of all saved violation forms
- **Vaporwave Theme**: Full retro-futuristic aesthetic implementation

### 🎨 **Changed**
- **UI/UX Design**: Complete redesign with Vice City theme and improved user experience
- **Mobile Optimization**: Fully optimized for iPhone 13+ devices on Safari and Chrome

---

**SPR Vice City** - Professional violation management for the digital age 🌴⚡