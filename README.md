# SPR Vice City - Mobile Violation Management App

## Project Overview

**SPR Vice City** is a mobile-first violation notice management application designed for field operations. Built with a Vaporwave retro-futuristic aesthetic set in Coastal South Carolina, this app enables my property management team to capture, document, export, and manage violation notices efficiently on mobile devices.

**Live URL**: https://lovable.dev/projects/22649cbf-4588-41b8-adc2-962a2e3dd1da

## Features

### 🎯 Core Functionality
- **Mobile Camera Integration**: Real-time photo capture with confirmation workflow
- **Violation Form Management**: Comprehensive form system for documenting violations
- **User Authentication**: Secure invite-only registration system with role-based access
- **Data Export**: Email and print export capabilities for violation notices with the ability to attach photos taken both in the field, and added from User's mobile device.
- **Books Library**: Searchable archive of all saved violation forms with centered, responsive layout

### 📱 Mobile-Optimized Design
- **iPhone 13+ Responsive**: Fully optimized for iPhone 13 to current generation iPhones on Safari and Chrome
- **Safe Area Support**: Proper handling of device notches and home indicators using CSS `env()` functions
- **Touch-Friendly Interface**: Minimum 44px touch targets for iOS accessibility compliance
- **Viewport Optimization**: Enhanced viewport configuration with mobile-specific meta tags
- **Centered Content**: All UI elements properly centered with responsive containers and breakpoints
- **Mobile-First Approach**: Designed primarily for mobile with progressive enhancement
- **Full-Screen Coverage**: Eliminates white space with proper CSS positioning and viewport handling

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
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with invite system
- **State Management**: React Query + Context API
- **Routing**: React Router DOM
- **Icons**: Lucide React + Material Symbols

## Project Structure & Routing Logic

### Core Application Files

```
src/
├── main.tsx                 # App entry point with mobile optimizations
├── App.tsx                  # Main app component with routing configuration
├── index.css               # Global styles with mobile-first CSS and layout fixes
├── components/             # Reusable UI components
│   ├── ui/                # shadcn/ui components + mobile utilities
│   │   └── mobile-responsive.tsx # Mobile-specific utility components
│   ├── CameraCapture.tsx  # Camera functionality with mobile optimization
│   └── [other components]
├── pages/                 # Route components
│   ├── Dashboard.tsx      # Main dashboard with full-screen background and responsive menu
│   ├── Auth.tsx          # Authentication page
│   ├── Capture.tsx       # Camera capture page wrapper
│   ├── Books.tsx         # Violation forms library
│   ├── Export.tsx        # Export functionality
│   ├── Admin.tsx         # Admin panel
│   ├── DetailsLive.tsx   # Live form details
│   └── DetailsPrevious.tsx # Previous form details
├── hooks/                # Custom React hooks
│   ├── useAuth.tsx       # Authentication context
│   └── use-toast.ts      # Toast notifications
└── integrations/         # External service integrations
    └── supabase/         # Supabase client and types
```

### Routing Configuration (`App.tsx`)

The application uses React Router DOM with the following route structure:

```typescript
<Routes>
  <Route path="/" element={<Dashboard />} />           // Main dashboard
  <Route path="/auth" element={<Auth />} />            // Authentication
  <Route path="/capture" element={<Capture />} />      // Camera capture
  <Route path="/details-live" element={<DetailsLive />} />     // Live form
  <Route path="/details-previous" element={<DetailsPrevious />} /> // Previous forms
  <Route path="/books" element={<Books />} />          // Forms library
  <Route path="/export" element={<Export />} />        // Export page
  <Route path="/admin" element={<Admin />} />          // Admin panel
  <Route path="*" element={<NotFound />} />            // 404 fallback
</Routes>
```

### Key File Responsibilities

#### **File Architecture & Routing Logic Explained**

**🔍 Common Confusion: `main.tsx` vs `Dashboard.tsx`**

- **`main.tsx`** = **Application Bootstrap/Entry Point**
  - **Purpose**: Initializes the entire React application
  - **Role**: Sets up mobile optimizations, viewport fixes, and renders the root `<App />` component
  - **Routing**: NOT a route - this file runs once when the app starts
  - **Contains**: Mobile viewport calculations, touch behavior prevention, gesture handling
  - **Think of it as**: The "launcher" that starts your app and applies global mobile settings

- **`Dashboard.tsx`** = **Main Navigation Page/Route**
  - **Purpose**: The main landing page users see after authentication
  - **Role**: Displays the hamburger menu with semi-circle button layout
  - **Routing**: Accessible at route `"/"` (root path)
  - **Contains**: Navigation buttons, background image, authentication checks
  - **Think of it as**: The "home screen" where users choose what to do

**🔍 Common Confusion: `Capture.tsx` vs `CameraCapture.tsx`**

- **`Capture.tsx`** = **Route Wrapper/Authentication Guard**
  - **Purpose**: Protects the camera route and handles authentication
  - **Role**: Checks if user is logged in before allowing camera access
  - **Routing**: Accessible at route `"/capture"`
  - **Contains**: Authentication logic, loading states, redirects to `/auth` if not logged in
  - **Think of it as**: The "security guard" that checks your ID before letting you use the camera

- **`CameraCapture.tsx`** = **Actual Camera Implementation**
  - **Purpose**: The complete camera functionality and UI
  - **Role**: Handles camera stream, photo capture, confirmation workflow
  - **Routing**: NOT a route - it's a component rendered by `Capture.tsx`
  - **Contains**: Camera controls, photo capture logic, image processing, mobile optimizations
  - **Think of it as**: The "actual camera app" with all the photo-taking features

#### **Routing Flow Example:**
```
User visits "/capture"
    ↓
Capture.tsx checks authentication
    ↓
If authenticated: renders <CameraCapture />
If not authenticated: redirects to "/auth"
    ↓
CameraCapture.tsx displays camera interface
```

#### `main.tsx` - Application Bootstrap
- **Vice City theme**: Neon effects, animations, and color variables
- **Full-screen utilities**: `dashboard-container` class for complete coverage

#### `tailwind.config.ts` - Responsive Configuration
- **iPhone-specific breakpoints**: Precise targeting for different iPhone models
- **Safe area spacing**: Utilities using `env(safe-area-inset-*)` functions
- **Touch target sizing**: Standardized touch-friendly dimensions
- **Custom color palette**: Vice City theme colors and variants

## Mobile Responsiveness Implementation

### 📋 **IMPORTANT FOR AI SESSIONS**: 
**When working on mobile responsiveness, UI scaling, or iPhone compatibility issues, always reference the `MOBILE_RESPONSIVE_IMPLEMENTATION.md` file first. This document contains comprehensive details about all mobile optimizations, breakpoints, safe area handling, and iPhone-specific implementations.**

### iPhone Support Matrix
- **iPhone SE (375px)**: Optimized with smaller elements and tighter spacing
- **iPhone 13/14/15 (390px)**: Standard responsive sizing with balanced proportions
- **iPhone 13/14/15 Pro (393px)**: Consistent with standard models
- **iPhone 13/14/15 Pro Max (428px)**: Enhanced spacing and larger touch targets

### Browser Compatibility
- **Safari iOS**: Full PWA support with proper safe area handling
- **Chrome iOS**: Consistent responsive behavior and touch optimization

### Key Mobile Features
- **Safe Area Handling**: Automatic padding for notches and home indicators
- **Touch Optimization**: 44px minimum touch targets per iOS guidelines
- **Viewport Fixes**: Dynamic height calculation for iOS Safari's changing viewport
- **Gesture Prevention**: Disabled zoom and unwanted touch behaviors
- **Responsive Typography**: Automatic text scaling based on screen size

## Common Styling Issues & Solutions

### 🚨 **White Space & Layout Problems**

#### **Problem**: White space around edges or background not covering full screen
**Root Causes**:
- `overflow: hidden` on html/body elements
- Missing margin/padding reset
- Viewport meta tag configuration issues
- CSS reset not properly applied
=======
- Incorrect viewport height calculations
- Background image positioning issues

#### **Solution Applied**:
```css
/* Fixed in src/index.css */
html, body {
  height: 100%;
  margin: 0;           /* Critical: Remove default margins */
  padding: 0;          /* Critical: Remove default padding */
}

/* Dashboard full-screen utility */
.dashboard-container {
  position: fixed;     /* Critical: Fixed positioning */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  height: -webkit-fill-available;
}
```

#### **Prevention Best Practices**:
1. **Always reset margins/padding** on html, body elements
2. **Use fixed positioning** for full-screen containers
3. **Test viewport calculations** with CSS custom properties
4. **Avoid `overflow: hidden`** on root elements unless necessary
5. **Use `dashboard-container` class** for full-screen coverage

### 🚨 **SWC Binding Errors**

#### **Problem**: "Failed to load native binding" error preventing dev server start
**Root Cause**: SWC compiler native bindings not properly installed for Windows

#### **Solution**:
```bash
# Remove node_modules and reinstall
npm install

# If error persists, install Windows-specific SWC binding
npm install @swc/core-win32-x64-msvc --save-dev
```

#### **Prevention**:
- **Regular dependency updates**: Keep SWC and Vite updated
- **Platform-specific installs**: Ensure proper native bindings for your OS
- **Clean installs**: Periodically remove node_modules and reinstall

### 🚨 **Background Image Display Issues**

#### **Problem**: Background images not loading or displaying
**Common Causes**:
- Incorrect file paths
- Browser caching
- Missing background properties

#### **Solution Applied**:
```typescript
// In Dashboard.tsx
const backgroundImage = '/2.jpeg';

style={{
  backgroundImage: `url("${backgroundImage}")`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
}}
```

#### **Prevention**:
1. **Use explicit background properties** (size, position, repeat)
2. **Add fallback background colors** for loading states
3. **Test image paths** in public directory
4. **Hard refresh browser** to clear cache issues

## Database Schema

### Tables
- **profiles**: User profiles with role-based access (admin/user)
- **invites**: Invitation system for user registration
- **violation_forms**: Violation notice records with photos and metadata

### Security
- **Row Level Security (RLS)**: Enabled on all tables
- **Role-Based Access**: Admin and user roles with appropriate permissions
- **Invite-Only Registration**: Users must have valid invites to register

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with camera access
- iPhone 13+ or equivalent Android device for optimal experience

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Troubleshooting Setup Issues

#### **If dev server fails to start**:
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# For Windows SWC binding issues
npm install @swc/core-win32-x64-msvc --save-dev
```

#### **If background images don't load**:
1. Hard refresh browser (`Ctrl+Shift+R` or `Cmd+Shift+R`)
2. Check browser console for 404 errors
3. Verify image exists in `public/` directory
4. Clear browser cache

#### **If white space appears**:
1. Check for `overflow: hidden` in CSS
2. Verify margin/padding reset on html/body
3. Use `dashboard-container` class for full-screen components
4. Test viewport height calculations

### Environment Setup

The project uses Supabase for backend services. Environment variables are automatically configured:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Usage Guide

### For Administrators
1. **Initial Setup**: Set your admin email in the database function
2. **Create Invites**: Use the Admin panel to generate invitation links
3. **Manage Users**: View and manage user registrations

### For Field Users
1. **Authentication**: Register using an invitation link
2. **Capture Violations**: Use the camera to document violations
3. **Fill Details**: Complete violation forms with required information
4. **Save to Books**: Store completed forms in the searchable library
5. **Export Data**: Email or print violation notices as needed

## Key Features Detail

### Camera System
- **Environment Camera**: Uses rear-facing camera for better photo quality
- **Mobile-Optimized Controls**: Responsive touch targets and safe area handling
- **Confirmation Workflow**: Two-step capture process (capture → confirm)
- **Session Storage**: Temporarily stores captured images during form completion

### Form Management
- **Auto-Population**: DetailsLive.tsx auto-fills current date/time
- **Validation**: Ensures required fields and violation types are selected
- **Status Tracking**: Book Em button serves as Save form functionality including photos
- **Mobile-Responsive Forms**: Optimized input fields and touch-friendly controls

### Export System
- **Email Export**: Allows users to email up to 4 violations at one time with photo attachments
- **Print Layout**: 2x2 grid layout optimized for printing (max 4 forms) scaled to fit standard paper
- **Batch Operations**: Select multiple forms for bulk export
- **Mobile Export UI**: Touch-optimized selection and export controls

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Organization
- **Modular Architecture**: Each component focuses on single responsibility
- **TypeScript**: Full type safety throughout the application
- **Clean Imports**: Proper import/export structure
- **Mobile-First Design**: Progressive enhancement from mobile to desktop

### Mobile Development Guidelines
1. **Always test on actual iPhone devices** when possible
2. **Use browser developer tools** with device emulation for initial testing
3. **Verify safe area handling** on notched devices
4. **Test both portrait and landscape** orientations
5. **Validate touch interactions** and gesture handling
6. **Reference MOBILE_RESPONSIVE_IMPLEMENTATION.md** for detailed specifications
7. **Use `dashboard-container` class** for full-screen components
8. **Always reset margins/padding** on root elements

### Styling Best Practices
1. **Mobile-First Approach**: Start with mobile styles, enhance for desktop
2. **Use Tailwind Utilities**: Leverage existing classes before custom CSS
3. **Test Viewport Heights**: Use CSS custom properties for dynamic calculations
4. **Implement Safe Areas**: Always consider device notches and home indicators
5. **Optimize Touch Targets**: Minimum 44px for iOS accessibility
6. **Prevent Layout Shifts**: Use fixed positioning for full-screen elements

## Deployment

### Bolt Hosting
Simply open the [Lovable Project](https://lovable.dev/projects/22649cbf-4588-41b8-adc2-962a2e3dd1da) and click Share → Publish.

### Custom Domain
Navigate to Project > Settings > Domains to connect a custom domain.
[Domain Setup Guide](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Security Features

### 🚨 **File Confusion & Architecture Issues**

#### **Problem**: Confusion between similar file names and their purposes
**Common Confusions**:
- `main.tsx` vs `Dashboard.tsx` - "Which one is the main page?"
- `Capture.tsx` vs `CameraCapture.tsx` - "Why are there two camera files?"
- Route components vs regular components

#### **Solution & Understanding**:

**File Naming Convention**:
```
src/
├── main.tsx                    # ⚡ App entry point (NOT a page)
├── App.tsx                     # 🔀 Router configuration
├── pages/                      # 📄 Route components (pages)
│   ├── Dashboard.tsx           # 🏠 Main navigation page
│   ├── Capture.tsx             # 🔒 Camera route wrapper
│   ├── Books.tsx               # 📚 Forms library page
│   └── [other pages]
└── components/                 # 🧩 Reusable components
    ├── CameraCapture.tsx       # 📷 Actual camera functionality
    └── [other components]
```

**Quick Reference**:
- **Files in `src/pages/`** = Routes (accessible via URL)
- **Files in `src/components/`** = Reusable components (used by pages)
- **`main.tsx`** = App startup (runs once)
- **`App.tsx`** = Router setup (defines all routes)

#### **Prevention**:
1. **Follow naming conventions**: Pages in `/pages/`, components in `/components/`
2. **Use descriptive names**: `AuthWrapper.tsx` instead of `Auth.tsx` for wrappers
3. **Add comments**: Clearly document file purposes
4. **Consistent patterns**: All route wrappers follow same authentication pattern

## Common Styling Issues & Solutions

- **Invite-Only Registration**: Prevents unauthorized access
- **Row Level Security**: Database-level access control
- **Role-Based Permissions**: Admin and user role separation
- **Session Management**: Secure authentication state handling

## Browser Support

- **Primary Target**: iPhone 13+ Safari and Chrome
- **Secondary Support**: Modern browsers (Chrome 90+, Firefox 88+)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Camera API**: Requires HTTPS for camera access in production

## Contributing

This project follows mobile-first development principles. When making changes:
1. **Reference MOBILE_RESPONSIVE_IMPLEMENTATION.md** for mobile specifications
2. Test on actual iPhone devices (iPhone 13+ recommended)
3. Ensure touch targets meet iOS accessibility standards (44px minimum)
4. Verify camera functionality across different devices
5. Maintain the Vice City aesthetic theme
6. Test safe area handling on notched devices
7. **Always check for white space issues** after layout changes
8. **Use proper CSS reset** for margins and padding
9. **Test background image display** across different devices

## Support

For technical issues or feature requests, refer to the Lovable platform documentation or contact the development team.

---

## AI Assistant Instructions

### 📋 **Critical Reference Document**
**When working on any mobile responsiveness, UI scaling, iPhone compatibility, or viewport issues, ALWAYS reference the `MOBILE_RESPONSIVE_IMPLEMENTATION.md` file first. This document contains:**
- Comprehensive mobile optimization details
- iPhone-specific breakpoints and configurations
- Safe area handling implementation
- Touch target specifications
- Browser compatibility notes
- Testing recommendations

### 🚨 **Common Issue Resolution**
**For styling problems (white space, background images, layout issues):**
1. **Check CSS reset**: Ensure html/body have margin: 0, padding: 0
2. **Use dashboard-container**: Apply `.dashboard-container` class for full-screen coverage
3. **Avoid overflow: hidden**: On root elements unless absolutely necessary
4. **Test viewport calculations**: Use CSS custom properties for dynamic heights
5. **Hard refresh browser**: Clear cache with Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Development History
This project was developed through the following key iterations:

1. **Initial Setup**: Started with a Vite React TypeScript template
2. **Authentication System**: Implemented Supabase authentication with invite-only registration
3. **Mobile Optimization**: Configured the app specifically for mobile devices with proper viewport handling
4. **Vice City Theme**: Applied retro-futuristic styling with neon colors and custom fonts
5. **Core Features**: Built camera capture, violation forms, books library, and export functionality
6. **Dashboard Design**: Created a hamburger menu with semi-circle button layout
7. **Bug Fixes**: Resolved JSX parsing errors and component structure issues
8. **Background Update**: Replaced animated effects with static 2.jpeg background image
9. **Button Spacing**: Fixed overlapping issues in the semi-circle menu layout
10. **Books Library Mobile Enhancement**: Complete responsive redesign with proper content centering
11. **iPhone 13+ Optimization**: Comprehensive mobile responsiveness implementation with safe area support
12. **Styling Issues Resolution**: Fixed white space problems, SWC binding errors, and background image display

### AI Prompt for Project Context

When working with this project, use this context to understand the requirements:

```
This is SPR Vice City, a mobile-first violation notice management application for field operations.

Key project requirements:
- **PRIMARY TARGET**: iPhone 13 to current generation iPhones on Safari and Chrome
- Mobile-optimized with comprehensive responsive design and safe area handling
- Vaporwave retro-futuristic aesthetics with neon colors (vice-purple #8b2fa0, vice-pink #ff1493, vice-cyan #00ffff, vice-blue #4169e1)
- Supabase backend with invite-only authentication system
- Camera integration for violation photo capture with mobile optimization
- Form management system for violation notices
- Export capabilities (email/print) with mobile-friendly UI
- Books library for saved forms with fully responsive, centered layout
- Dashboard with hamburger menu and responsive semi-circle button layout
- Uses 2.jpeg as background image on Dashboard with full-screen coverage
- All UI must be fully visible on iPhone screens without content cutoff or white space
- Touch targets minimum 44px for iOS accessibility compliance
- Safe area support for notched devices using CSS env() functions
- Uses Work Sans font family and Material Symbols icons

CRITICAL: 
- Always reference MOBILE_RESPONSIVE_IMPLEMENTATION.md when working on mobile UI issues
- Use dashboard-container class for full-screen components
- Ensure proper CSS reset (margin: 0, padding: 0) on html/body elements
- Test for white space issues after any layout changes
```

### File Priority for Mobile Issues
When troubleshooting mobile responsiveness or styling problems:
1. **First**: Check `MOBILE_RESPONSIVE_IMPLEMENTATION.md`
2. **Then**: Review `src/index.css` for global styles and layout fixes
3. **Next**: Examine `tailwind.config.ts` for breakpoints and utilities
4. **Finally**: Check component-specific implementations in `src/pages/` and `src/components/`