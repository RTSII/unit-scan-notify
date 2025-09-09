# SPR Vice City - Changelog

All notable changes to the SPR Vice City project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


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