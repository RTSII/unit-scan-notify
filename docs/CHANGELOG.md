
## [2.1.7] - 2025-09-16

### ✨ Documentation & UI Consistency
- Added `UI_3D_CAROUSEL_SPEC.md` as the canonical Admin-style 3D carousel visual/behavioral spec and integration guide
- Updated `README.md` to reference the new spec
- Updated `MOBILE_RESPONSIVE_IMPLEMENTATION.md` with Admin-style carousel details and cross-reference

### 🎨 UI Alignment
- Standardized the 3D carousel implementation across `src/pages/Admin.tsx` and `src/pages/Books.tsx`:
  - Dense, square, rounded thumbnails with subtle spacing
  - In-thumbnail neon cyan overlay (Unit and Date)
  - Densification to maintain continuous, well-populated ring feel
  - 140px high track container with `overflow-hidden`
  - Unique `layoutId` per face for smooth modal transitions
  - Only-one-open-at-a-time behavior for collapsible sections; click-outside collapse

# SPR Vice City - Changelog

All notable changes to the SPR Vice City project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [2.1.6] - 2025-01-XX

### 🚀 **FEATURE RELEASE - Enhanced Form Interactions & Mobile UX**

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