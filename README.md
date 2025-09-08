# SPR Vice City - Mobile Violation Management App

## Project Overview

**SPR Vice City** is a mobile-first violation notice management application designed for field operations. Built with a Vaporwave retro-futuristic aesthetic set in Coastal South Carolina, this app enables my property management team to capture, document, export, and manage violation notices efficiently on mobile devices.

**Live URL**: https://lovable.dev/projects/22649cbf-4588-41b8-adc2-962a2e3dd1da

## 🚀 Recent Updates (2025)

### ✅ **Latest Updates - September 7, 2025**
- **Enhanced Violation Forms**: Combined violation types with selectable options (items/trash, balcony/front)
- **New Violation Type**: Added "Items left in Parking lot" violation category
- **Improved Date/Time Entry**: Auto-formatting for MM/DD date and HH:MM time with AM/PM selector
- **Auto-Capitalization**: Unit field automatically converts to uppercase
- **"Book Em" Button**: Redesigned save buttons with consistent oval styling and photo count badges
- **Books Page Fixes**: Fixed filter dropdown persistence, enhanced search functionality, improved time formatting
- **Click-Outside Functionality**: Filter dropdown now properly closes when clicking outside
- **Enhanced Error Handling**: Added null checks and improved data validation throughout

### ✅ **Latest Updates - September 8, 2025**
- **Image Optimization**: Optimized SPR logo (`vicecity.png`) from 297KB to 58KB (80% reduction)
- **Repository Cleanup**: Removed unused images and files, saving approximately 8.7MB
- **Git Configuration**: Updated `.gitignore` to properly exclude unnecessary files
- **Enhanced Violation Forms**: Combined violation types with selectable options (items/trash, balcony/front)
- **New Violation Type**: Added "Items left in Parking lot" violation category
- **Improved Date/Time Entry**: Auto-formatting for MM/DD date and HH:MM time with AM/PM selector
- **Auto-Capitalization**: Unit field automatically converts to uppercase
- **"Book Em" Button**: Redesigned save buttons with consistent oval styling and photo count badges
- **Books Page Fixes**: Fixed filter dropdown persistence, enhanced search functionality, improved time formatting
- **Click-Outside Functionality**: Filter dropdown now properly closes when clicking outside
- **Enhanced Error Handling**: Added null checks and improved data validation throughout

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
- **Database**: Supabase (PostgreSQL) with CLI management
- **Authentication**: Supabase Auth with invite system
- **State Management**: React Query + Context API
- **Routing**: React Router DOM
- **Icons**: Lucide React + Material Symbols
- **Database Management**: Supabase CLI v2.39.2 with custom migration helpers

## 🛠️ Database Management

### Quick Commands
```bash
# List all migrations
npm run migrate:list

# Create new migration
npm run migrate:new "feature name"

# View migration content
node migrate.js show filename.sql

# Supabase CLI access
npm run supabase -- [command]
```

### Database Features
- **12 Applied Migrations**: Complete schema with admin policies and user activity tracking
- **Row Level Security**: Comprehensive RLS implementation
- **Custom Views**: `user_activity_summary`, `recent_team_activity`, `team_performance_summary`
- **Admin Functions**: `get_team_stats()` for dashboard metrics
- **Migration System**: Professional migration management with templates

📖 **Full Documentation**: See `DATABASE_MANAGEMENT.md` for complete database management guide.

## Project Structure & Routing Logic

### Core Application Files

```
src/
├── main.tsx                 # App entry point with mobile optimizations
├── App.tsx                  # Main app component with routing
├── index.css               # Global styles with Vice City theme
├── vite-env.d.ts           # Vite type definitions
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── ViolationForm.tsx   # Main violation form component
│   ├── CameraCapture.tsx   # Mobile camera integration
│   ├── PhotoPreview.tsx    # Photo confirmation workflow
│   └── Navigation.tsx      # Mobile navigation component
├── pages/
│   ├── Index.tsx           # Landing page with auth
│   ├── Dashboard.tsx       # Main dashboard
│   ├── Admin.tsx           # Admin panel with statistics
│   ├── Books.tsx           # Violation archive with team visibility
│   ├── Auth.tsx            # Authentication pages
│   └── Settings.tsx        # User settings
├── hooks/
│   ├── useAuth.tsx         # Authentication hook (fixed)
│   ├── useViolationForm.tsx # Form state management
│   └── useCamera.tsx       # Camera functionality
├── lib/
│   ├── supabase.ts         # Supabase client configuration
│   └── utils.ts            # Utility functions
└── types/
    └── violation.ts        # TypeScript type definitions
```

### Database Structure
```
supabase/
├── config.toml             # Project configuration
├── migrations/             # Database migrations (12 files)
│   ├── 20250127000003_add_admin_violation_policies.sql
│   ├── 20250127000004_add_user_activity_tracking.sql
│   └── [other migrations]
└── [generated files]
```

### Additional Files
```
├── migrate.js              # Custom migration helper
├── DATABASE_MANAGEMENT.md  # Database documentation
├── AUTHENTICATION_SETUP.md # Auth setup guide
├── MOBILE_RESPONSIVE_IMPLEMENTATION.md # Mobile guide
└── package.json            # Enhanced with DB scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd unit-scan-notify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - All migrations are already applied
   - Admin user: `rob@ursllc.com` / `basedgod1`
   - See `DATABASE_MANAGEMENT.md` for details

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Admin Access
- **Email**: `rob@ursllc.com`
- **Password**: `basedgod1`
- **Features**: Full admin dashboard with team statistics and user management

## 📱 Mobile Usage

### Supported Devices
- **Primary**: iPhone 13, 14, 15, 16 series
- **Browsers**: Safari (primary), Chrome
- **Orientation**: Portrait optimized

### Key Mobile Features
- **Camera Integration**: Native camera access with photo confirmation
- **Touch Optimization**: 44px minimum touch targets
- **Safe Area Handling**: Proper notch and home indicator support
- **Responsive Design**: Fluid layouts that adapt to screen sizes
- **Performance**: Optimized for mobile performance and battery life

## 🔐 Authentication & Security

### User Management
- **Invite-Only Registration**: Secure team member onboarding
- **Role-Based Access**: Admin and user roles with appropriate permissions
- **Row Level Security**: Database-level security for all tables
- **Session Management**: Secure authentication with Supabase Auth

### Admin Features
- **User Activity Tracking**: Monitor team member actions and engagement
- **Violation Management**: View and manage all team violations
- **Performance Analytics**: Team statistics and productivity metrics
- **Database Administration**: Professional migration and schema management

## 🎨 Design System

### Color Palette
- **Primary Purple**: `#8b2fa0` (Vice purple)
- **Accent Pink**: `#ff1493` (Hot pink)
- **Neon Cyan**: `#00ffff` (Cyan)
- **Electric Blue**: `#4169e1` (Royal blue)
- **Sunset Orange**: `#ff6347` (Tomato)

### Typography
- **Font Family**: Work Sans
- **Weights**: 300, 400, 500, 600, 700
- **Effects**: Neon glow, text shadows, gradient text

### Components
- **shadcn/ui**: Modern, accessible component library
- **Custom Components**: Vice City themed with neon effects
- **Mobile Optimized**: Touch-friendly with proper spacing

## 📊 Database Schema

### Core Tables
- **`profiles`**: User profiles with role management
- **`violation_forms`**: Main violation data with photos
- **`invites`**: User invitation system
- **`user_activity`**: Activity tracking and analytics

### Views & Functions
- **`user_activity_summary`**: User statistics and metrics
- **`recent_team_activity`**: 30-day activity overview
- **`team_performance_summary`**: Overall team performance
- **`get_team_stats()`**: Function for admin dashboard

### Security
- ✅ Row Level Security enabled on all tables
- ✅ Role-based access control (admin/user)
- ✅ Team transparency (all users see all violations)
- ✅ Edit restrictions (users can only edit their own data)

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

### Hosting
- **Primary**: Lovable.dev platform
- **Alternative**: Vercel, Netlify, or any static hosting
- **Database**: Supabase (hosted PostgreSQL)

## 📚 Documentation

- **`DATABASE_MANAGEMENT.md`**: Complete database management guide
- **`AUTHENTICATION_SETUP.md`**: Authentication setup and user management
- **`MOBILE_RESPONSIVE_IMPLEMENTATION.md`**: Mobile optimization guide

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

**Version**: 2.0.0 (January 2025)  
**Database**: Supabase with CLI management  
**Mobile**: iPhone 13+ optimized  
**Admin**: Full dashboard with team analytics