# SPR Vice City - Mobile Violation Management App

## Project Overview

**SPR Vice City** is a mobile-first violation notice management application designed for field operations. Built with a Synth-wave retro-futuristic aesthetic set in Coastal South Carolina, this app enables my property management team to capture, document, export, and manage violation notices efficiently on mobile devices.

**Live URL**: https://spr-vicecity.lovable.app/

### ✅ **Latest Updates - September 20, 2025**
- **Camera Capture Fixes**: Fixed red X button to properly resume live video preview after canceling photo capture
- **Books Navigation Enhancement**: Added automatic data refresh when navigating to Books page after saving forms
- **Improved User Workflow**: Newly saved violation forms now appear immediately in the books library without manual refresh
- **Live URL Update**: Updated to new production URL: https://spr-vicecity.lovable.app/

### ✅ **Latest Updates - September 8, 2025**
- **Texture Card Components**: Implemented custom TextureCard UI components for enhanced visual design
- **Header Improvements**: Centered "Details" title with home button icon positioning in both Details forms
- **UI Styling Updates**: Changed TextureCard background to black for improved contrast and aesthetics
- **Enhanced Violation Forms**: Combined violation types with selectable options (items/trash, balcony/front)
- **New Violation Type**: Added "Items left in Parking lot" violation category
- **Improved Date/Time Entry**: Auto-formatting for MM/DD date and HH:MM time with AM/PM selector
- **Auto-Capitalization**: Unit field automatically converts to uppercase
- **"Book Em" Button**: Redesigned save buttons with consistent oval styling and photo count badges
- **Books Page Fixes**: Fixed filter dropdown persistence, enhanced search functionality, improved time formatting
- **Click-Outside Functionality**: Filter dropdown now properly closes when clicking outside
- **Enhanced Error Handling**: Added null checks and improved data validation throughout

### ✅ **Latest Updates - September 9, 2025**
- **Dashboard Redesign**: Vertically centered Siri Orb as the primary navigation hub with 4-button arc menu
- **User Avatar Integration**: Added user avatar in top-right corner with sign-out functionality
- **Enhanced 3D Carousel**: Improved Books.tsx carousel with Vice City styled thumbnails and optimized sizing
- **Mobile Responsiveness**: All new dashboard elements fully responsive across all device sizes
- **Background Update**: Switched dashboard background from 2.jpeg to 2.png for better quality
- **Single Card Expansion**: Only one card expands at a time in Books.tsx with click-outside collapse functionality
- **Git Configuration**: Updated `.gitignore` to properly exclude unnecessary files
- **Camera Improvements**: Enhanced camera functionality with better iOS compatibility and proper rear camera priority
- **No Mirroring for Rear Camera**: Rear camera feed and captured images are no longer mirrored for accurate violation documentation
- **Improved Camera Constraints**: Simplified camera constraints that work better on iOS devices with multiple fallback options
- **Enhanced Error Handling**: More detailed error messages for different types of camera access failures
- **Better Debugging**: Additional console logs to help troubleshoot camera issues

### ✅ **Admin Panel & Database Management (January 2025)**
- **Full Admin Dashboard**: Complete admin panel with team statistics, user activity tracking, and violation management
- **Supabase CLI Integration**: Local CLI setup with custom migration helpers for professional database management
- **Enhanced Authentication**: Fixed authentication issues and improved user experience
- **Team Transparency**: All users can now view all violations while maintaining edit restrictions
- **Database Migrations**: Comprehensive migration system with automated admin policies and user activity tracking

### ✅ **Database Features**
- **User Activity Tracking**: Real-time monitoring of user actions and form completions
- **Team Performance Metrics**: Comprehensive statistics and performance indicators
- **Row Level Security (RLS)**: Complete security implementation with role-based access control
- **Admin Policies**: Dedicated admin access to all data with proper security boundaries

## Features

### 🎯 Core Functionality
- **Mobile Camera Integration**: Real-time photo capture with confirmation workflow
- **Violation Form Management**: Comprehensive form system for documenting violations
- **User Authentication**: Secure invite-only registration system with role-based access
- **Data Export**: Email and print export capabilities for violation notices with the ability to attach photos taken both in the field, and added from User's mobile device
- **Books Library**: Searchable archive of all saved violation forms with user profile information and team visibility
- **Admin Dashboard**: Complete administrative interface with team statistics and user management

### 📊 **Admin Features**
- **Team Statistics Dashboard**: Real-time metrics showing total violations, active users, and completion rates
- **User Activity Monitoring**: Track user actions, form submissions, and engagement metrics
- **Violation Management**: View and manage all team violations with user attribution
- **Performance Analytics**: 30-day activity summaries and team performance indicators
- **Database Management**: Professional migration system with CLI tools

### 📱 Mobile-Optimized Design
- **iPhone 13+ Responsive**: Fully optimized for iPhone 13 to current generation iPhones on Safari and Chrome
- **Safe Area Support**: Proper handling of device notches and home indicators using CSS `env()` functions
- **Touch-Friendly Interface**: Minimum 44px touch targets for iOS accessibility compliance
- **Viewport Optimization**: Enhanced viewport configuration with mobile-specific meta tags
- **Centered Content**: All UI elements properly centered with responsive containers and breakpoints
- **Mobile-First Approach**: Designed primarily for mobile with progressive enhancement
- **Full-Screen Coverage**: Eliminates white space with proper CSS positioning and viewport handling
- **Active Section Positioning**: In multi-section interfaces with 3D carousels, expanded sections automatically move to the top position for improved visibility and user experience

### 🎨 Vice City Theme
- **Vaporwave Retro-Futuristic Design**: Neon colors, gradients, beach/ocean elements, and cyberpunk aesthetics
- **Custom Typography**: Work Sans font family with neon glow effects
- **Background Integration**: Seamless 2.jpeg background image with proper overlay effects
- **Animated Elements**: Subtle animations and hover states optimized for mobile performance
- **Color Palette**: Vice purple (#8b2fa0), pink (#ff1493), cyan (#00ffff), blue (#4169e1), and orange (#ff6347)

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite with SWC compiler
- **Styling**: Tailwind CSS + shadcn/ui components
- **UI Components**: Custom TextureCard components for enhanced visual design
- **State Management**: React Hooks and Context API
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Deployment**: Lovable.dev platform

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or bun package manager
- Supabase account

### Installation

npm install
```

### Environment Setup
Create a `.env.local` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

### Note
A dev-only toolbar toggle is available for testing purposes. See the `TOOLBAR_INTEGRATION.md` documentation for more information.

### Hosting
- **Primary**: Lovable.dev platform
- **Alternative**: Vercel, Netlify, or any static hosting
- **Database**: Supabase (hosted PostgreSQL)

## 📚 Documentation

- **`DATABASE_MANAGEMENT.md`**: Complete database management guide
- **`AUTHENTICATION_SETUP.md`**: Authentication setup and user management
- **`MOBILE_RESPONSIVE_IMPLEMENTATION.md`**: Mobile optimization guide
- **`UI_3D_CAROUSEL_SPEC.md`**: Admin-style 3D carousel visual/behavioral spec and integration guide
- **`TOOLBAR_INTEGRATION.md`**: 21st.dev toolbar integration, usage, dev-only toggle, and troubleshooting

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Make changes with proper TypeScript types
3. Test on mobile devices (iPhone 13+)
4. Create database migrations if needed
5. Update documentation
6. Submit pull request

### Database Changes
1. Use `npm run migrate:new "feature name"`
2. Edit generated migration file
3. Test in Supabase Dashboard
4. Document changes in `DATABASE_MANAGEMENT.md`

## 📞 Support

For technical support or questions:
- Check existing documentation
- Review database migration examples
- Test changes in development environment first
- Use `npm run migrate` for database help

---

**SPR Vice City** - Professional violation management for the digital age 🌴⚡

**Version**: 2.1.4 (September 2025)  
**Database**: Supabase with CLI management  
**Mobile**: iPhone 13+ optimized  
**Admin**: Full dashboard with team analytics