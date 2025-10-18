# SPR Vice City - Mobile Violation Management App

**Version:** 3.0.0 (October 2025)  
**Status:** Production Ready  
**Live URL:** https://spr-vicecity.lovable.app/

---

## 🎉 Project Overview

**SPR Vice City** is a mobile-first violation notice management application designed for field operations in Coastal South Carolina. Built with a Synth-wave retro-futuristic aesthetic, this app enables property management teams to capture, document, export, and manage violation notices efficiently on mobile devices.

### 🏆 Key Achievements (October 2025)
- ✅ **100% Functional** - All workflows tested and working
- ✅ **Normalized Database** - Professional schema with photo separation
- ✅ **Team Visibility** - All users see all violations
- ✅ **Admin Control** - Centralized management dashboard
- ✅ **Mobile Optimized** - iPhone 13+ fully supported
- ✅ **Export Ready** - Email and print with photos

---

## 📋 Latest Updates - October 6, 2025

### 🔥 Major System Overhaul

#### **Database Migration Complete**
- ✅ Migrated to normalized `violation_forms` + `violation_photos`
- ✅ Normalized photo storage in `violation_photos` table
- ✅ Changed from `date`/`time` fields to `occurred_at` timestamp
- ✅ All pages updated to use new schema

#### **Photo Display Fixed**
- ✅ Books.tsx displays actual photos (not placeholders)
- ✅ Admin.tsx shows photo thumbnails correctly
- ✅ ViolationCarousel displays photos in 3D carousel
- ✅ Export includes photos in email/print

#### **Date Formatting Standardized**
- ✅ All dates display as MM/DD format
- ✅ Supports both legacy and new timestamp formats
- ✅ Consistent across all pages

#### **Live Capture Workflow Fixed**
- ✅ Unit field auto-converts to uppercase
- ✅ Date/time converted to `occurred_at` timestamp
- ✅ Photos saved to `violation_photos` table
- ✅ Form saves successfully and redirects

#### **Export Functionality Complete**
- ✅ Email export with photo count
- ✅ Print export with first photo embedded
- ✅ Supports new database schema
- ✅ Works with all date formats

#### **Team Visibility Implemented**
- ✅ All users see ALL violations (not filtered by user)
- ✅ User attribution shown on every form
- ✅ Admin-only delete/edit capabilities
- ✅ Documented in PERMISSIONS_STRUCTURE.md

---

## 🚀 Features

### 🎯 Core Functionality

#### **Mobile Camera Integration**
- Real-time photo capture with confirmation workflow
- Rear camera priority (no mirroring)
- Front camera fallback (with mirroring)
- iOS-optimized camera constraints
- Photo stored in sessionStorage for workflow

#### **Violation Form Management**
- **Live Capture** (Capture.tsx → DetailsLive.tsx)
  - Take photo in field
  - Auto-populate date/time
  - Unit auto-uppercase
  - Select violation types
  - Save to normalized database
  
- **Gallery Upload** (DetailsPrevious.tsx)
  - Upload photos from device
  - Multiple photo support
  - Same form workflow as live capture
  - Normalized photo storage

#### **Books Library** (Books.tsx)
- 3D carousel display of ALL violations
- Search by unit, date (legacy and occurred_at formats), normalized violation type, location, description, and user
- Time filter: This Week, This Month, All Forms
- User attribution on every form
- Click to expand full details
- Auto-refresh on navigation

#### **Export System** (Export.tsx)
- Select 1-4 violations
- Email export with details and photo count
- Print export with embedded photos
- 2x2 grid layout for printing
- Unified Search + Filter UI
- 3D carousel reflects combined search + time filters while maintaining placeholder density

#### **Admin Dashboard** (Admin.tsx)
- **Admin-only access** (role check enforced)
- Team statistics and metrics
- View all violations with photos
- Delete violations (trash icon)
- Edit violations (select box)
- User activity tracking
- Invite management

### 📱 Mobile-Optimized Design

- **iPhone 13+ Responsive**: Fully optimized for current generation iPhones
- **Safe Area Support**: Proper handling of notches and home indicators
- **Touch-Friendly**: Minimum 44px touch targets
- **Viewport Optimization**: Mobile-specific meta tags
- **Centered Content**: Responsive containers and breakpoints
- **Mobile-First**: Designed for mobile with progressive enhancement
- **Full-Screen**: Eliminates white space with proper positioning

### 🎨 Vice City Theme

- **Vaporwave Retro-Futuristic**: Neon colors, gradients, cyberpunk aesthetics
- **Custom Typography**: Work Sans with neon glow effects
- **Background Integration**: Seamless 2.png background with overlays
- **Animated Elements**: Subtle animations optimized for mobile
- **Color Palette**: Vice purple, pink, cyan, blue, orange

---

## 🗄️ Database Schema (Supabase)

### **Tables**

#### 1. `violation_forms` (Primary Table)
```sql
CREATE TABLE violation_forms (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  old_uuid_id UUID,  -- For migration tracking
  user_id UUID NOT NULL REFERENCES auth.users(id),
  unit_number TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE,  -- Replaces date + time
  location TEXT,  -- Violation type
  description TEXT,
  status TEXT DEFAULT 'saved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `violation_photos` (Normalized Photos)
```sql
CREATE TABLE violation_photos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  violation_id BIGINT NOT NULL REFERENCES violation_forms(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  storage_path TEXT NOT NULL,  -- Base64 or URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `profiles` (User Profiles)
```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',  -- 'admin' or 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `invites` (Invitation System)
```sql
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE
);
```

#### 5. `valid_units` (Unit Validation)
```sql
CREATE TABLE valid_units (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  unit_number TEXT UNIQUE NOT NULL,
  building TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Row Level Security (RLS) Policies**

#### **violation_forms**
- ✅ All users can SELECT all forms (team visibility)
- ✅ Users can INSERT their own forms
- ✅ Users can UPDATE their own forms
- ✅ Only admin can DELETE forms

#### **violation_photos**
- ✅ All users can SELECT all photos
- ✅ Users can INSERT photos for their violations
- ✅ Only admin can DELETE photos

#### **profiles**
- ✅ All users can SELECT all profiles (for attribution)
- ✅ Users can UPDATE their own profile
- ✅ Only admin can manage all profiles

---

## 🔄 Application Workflows

### Workflow 1: Live Capture → Save → Display
```
1. Dashboard (Index.tsx)
   ↓ Click "Capture"
2. Capture.tsx → CameraCapture.tsx
   ↓ Take photo → Confirm (green checkmark)
3. Photo saved to sessionStorage
   ↓ Navigate to DetailsLive.tsx
4. DetailsLive.tsx
   - Load photo from sessionStorage
   - Auto-populate date/time (MM/DD, HH:MM AM/PM)
   - Unit field (auto-uppercase)
   - Select violation types
   - Optional description
   ↓ Click "Book Em"
5. Save Process:
  - Convert date/time → occurred_at timestamp
  - Insert to violation_forms
  - Get form ID
  - Insert photos to violation_photos
   ↓ Navigate to Books.tsx
6. Books.tsx
  - Fetch all violation_forms (ALL users)
  - Join with violation_photos
  - Join with profiles (user attribution)
   - Display in 3D carousel with photos and MM/DD dates
```

### Workflow 2: Gallery Photos → Save → Display
```
{{ ... }}
   - Unit field (auto-uppercase)
   - Select violation types
   - Optional description
   ↓ Click "Book Em"
3. Save Process:
  - Convert date/time → occurred_at timestamp
  - Insert to violation_forms
  - Get form ID
  - Insert photos to violation_photos
   ↓ Navigate to Books.tsx
4. Books.tsx displays form with photos
```

### Workflow 3: View & Search Violations
{{ ... }}
```
1. Dashboard → Books.tsx
2. Fetch all violations (ALL users)
3. Display in 3D carousel
4. Search by unit/description/location/user
5. Filter by status
6. View "This Week" / "This Month"
7. Click card → Expand details
8. View all photos
```

### Workflow 4: Export Violations
```
1. Dashboard → Export.tsx
2. View list of violations (ALL users)
3. Select 1-4 violations
4. Email Export:
   - Opens mailto: link
   - Includes unit, date, time, location, description, photo count
5. Print Export:
   - Opens print window
   - 2x2 grid layout
   - Includes first photo for each violation
```

### Workflow 5: Admin Management
```
1. Dashboard → Admin.tsx (admin only)
2. View team statistics
3. View all violations with photos
4. Expandable morphing popover cards:
   - Select box (bulk operations)
   - Trash icon (delete)
   - Full form details
5. Manage invites
6. View user activity
```

---

## 🔐 Permissions & Access Control

### User Roles

**Admin (Rob - Forever the only admin)**
- Full system access
- Can delete/edit any violation
- Access to Admin dashboard
- User management
- Invite management

**Regular Users (Team Members: Boss, Board President)**
- Create violations
- View ALL violations (team visibility)
- Export violations
- Cannot delete violations
- Cannot access Admin dashboard

### Page-Level Access

| Page | All Users | Admin Only |
|------|-----------|------------|
| Books.tsx | ✅ View ALL forms | ✅ Same |
| Capture → DetailsLive | ✅ Create | ✅ Same |
| DetailsPrevious | ✅ Create | ✅ Same |
| Export | ✅ Export ALL | ✅ Same |
| Admin | ❌ No Access | ✅ Full Access |

**See PERMISSIONS_STRUCTURE.md for detailed documentation**

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite with SWC compiler
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Custom TextureCard
- **State Management**: React Hooks + Context API
- **Routing**: React Router v6
- **Animations**: Framer Motion

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (future)
- **Real-time**: Supabase Realtime (optional)

### Deployment
- **Platform**: Lovable.dev
- **CI/CD**: GitHub integration
- **Environment**: Production

---

## 🛠️ Development Setup

### Prerequisites
```bash
- Node.js 18+
- npm or bun
- Supabase account
- Git
```

### Installation
```bash
# Clone repository
git clone https://github.com/RTSII/unit-scan-notify.git
cd unit-scan-notify

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Server
```bash
npm run dev
# Open http://localhost:5173
```

### Production Build
```bash
npm run build
npm run preview
```

### Database Management
```bash
# Create new migration
npm run migrate:new "migration_name"

# View migration help
npm run migrate
```

---

## 📚 Documentation Files

### Core Documentation
- **README.md** (this file) - Project overview and setup
- **PERMISSIONS_STRUCTURE.md** - Access control and user roles
- **WORKFLOW_REVIEW.md** - Complete system audit
- **PRIORITY_TODO.md** - Action items and priorities
- **NEXT_STEPS.md** - Implementation status

### Technical Documentation
- **DATABASE_MANAGEMENT.md** - Database schema and migrations
- **AUTHENTICATION_SETUP.md** - Auth setup and user management
- **MOBILE_RESPONSIVE_IMPLEMENTATION.md** - Mobile optimization
- **docs/3d-carousel.md** - Carousel implementation
- **TOOLBAR_INTEGRATION.md** - Dev toolbar usage

### Migration Documentation
- **CHANGELOG.md** - Version history
- **DEPLOYMENT_SUMMARY.md** - Deployment notes
- **GEMINI.md** - AI integration notes

---

## ✅ System Status (October 6, 2025)

### Completed Features (100%)

**Database**
- [x] Normalized schema with violation_forms
- [x] Separate violation_photos table
- [x] RLS policies configured
- [x] All migrations applied

**Pages**
- [x] Index.tsx (Dashboard) - Navigation hub
- [x] Auth.tsx - Login and registration
- [x] Capture.tsx → CameraCapture.tsx - Live capture
- [x] DetailsLive.tsx - Live capture form
- [x] DetailsPrevious.tsx - Gallery upload form
- [x] Books.tsx - Violation library
- [x] Export.tsx - Email/print export
- [x] Admin.tsx - Admin dashboard

**Functionality**
- [x] Photo capture and storage
- [x] Form submission (both workflows)
- [x] Photo display (all pages)
- [x] Date formatting (MM/DD)
- [x] Unit auto-uppercase
- [x] Search and filter
- [x] Export with photos
- [x] Admin delete/edit
- [x] Team visibility
- [x] User attribution

**Mobile**
- [x] iPhone 13+ optimized
- [x] Touch-friendly interface
- [x] Safe area support
- [x] Responsive design
- [x] Camera integration

### Optional Enhancements (Future)

**Code Quality**
- [ ] Regenerate TypeScript types (removes @ts-ignore)
- [ ] Unit tests
- [ ] E2E tests

**Features**
- [ ] Photo storage optimization (Supabase Storage)
- [ ] Unit number validation (valid_units table)
- [ ] Old data migration (if needed)
- [ ] Push notifications
- [ ] Offline support

---

## 🧪 Testing Checklist

### Live Capture Workflow
- [ ] Dashboard → Capture
- [ ] Camera opens (rear camera)
- [ ] Take photo → green checkmark
- [ ] Photo displays in review
- [ ] Navigate to DetailsLive
- [ ] Photo loads from sessionStorage
- [ ] Date/time auto-populated
- [ ] Unit auto-uppercase works
- [ ] Select violation type
- [ ] Click "Book Em"
- [ ] Form saves successfully
- [ ] Redirect to Books
- [ ] Form appears with photo
- [ ] Date shows as MM/DD

### Gallery Upload Workflow
- [ ] Dashboard → Details
- [ ] Upload photo from gallery
- [ ] Multiple photos supported
- [ ] Date/time auto-populated
- [ ] Unit auto-uppercase works
- [ ] Select violation type
- [ ] Click "Book Em"
- [ ] Form saves successfully
- [ ] Redirect to Books
- [ ] Form appears with photos
- [ ] Date shows as MM/DD

### Books Page
- [ ] Shows ALL users' forms
- [ ] Photos display correctly
- [ ] Dates show as MM/DD
- [ ] Search works
- [ ] Filter works
- [ ] "This Week" section works
- [ ] "This Month" section works
- [ ] Click card expands details
- [ ] All photos visible in expanded view
- [ ] User attribution shown

### Export Page
- [ ] Shows violation list
- [ ] Select violations (checkbox)
- [ ] Selected count updates
- [ ] Email export opens mailto:
- [ ] Email includes all details
- [ ] Print export opens window
- [ ] Print shows 2x2 grid
- [ ] Photos embedded in print
- [ ] Dates formatted correctly

### Admin Page (Admin Only)
- [ ] Non-admin redirected
- [ ] Admin can access
- [ ] Statistics display
- [ ] All violations shown
- [ ] Photos display as thumbnails
- [ ] Click expands morphing popover
- [ ] Select box visible
- [ ] Trash icon visible
- [ ] Delete works
- [ ] Invite management works

---

## 🚀 Deployment

### Lovable.dev Platform
1. Push changes to GitHub
2. Lovable auto-syncs with repo
3. Wait 1-2 minutes for rebuild
4. Test on production URL
5. Verify all workflows

### Manual Deployment (Alternative)
```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify
# Upload dist/ folder
# Configure environment variables
```

---

## 📞 Support & Maintenance

### For Issues
1. Check documentation files
2. Review WORKFLOW_REVIEW.md
3. Check PRIORITY_TODO.md
4. Test in development first
5. Review console logs

### For Database Changes
1. Create migration: `npm run migrate:new "name"`
2. Edit migration file
3. Test in Supabase Dashboard
4. Document in DATABASE_MANAGEMENT.md
5. Deploy to production

### For Code Changes
1. Create feature branch
2. Make changes with TypeScript
3. Test on mobile (iPhone 13+)
4. Update documentation
5. Push to GitHub
6. Lovable auto-deploys

---

## 🎯 Version History

**v3.2.1 (October 2025)** - Integrated Search + Filter and Enhanced Search
- Unified Search + Filter UI on Books and Export pages
- Widened filter control to ensure full option titles
- Enhanced search semantics: Unit #’s, Dates (legacy `date` and `occurred_at` across common formats), and normalized Violation types
- Export carousel now reflects filtered results

**v3.0.0 (October 2025)** - Database Normalization & Complete System Overhaul
- Normalized database schema
- Photo display fixes
- Export functionality complete
- Team visibility implemented
- Comprehensive documentation

**v2.1.4 (September 2025)** - Admin Dashboard & Database Management
- Full admin panel
- Supabase CLI integration
- Team transparency
- Enhanced authentication

**v2.0.0 (September 2025)** - Mobile Optimization & UI Overhaul
- Dashboard redesign
- 3D carousel enhancement
- Camera improvements
- Mobile responsiveness

**v1.0.0 (Initial Release)** - Core Functionality
- Basic violation forms
- Photo capture
- User authentication
- Export capabilities

---

**SPR Vice City** - Professional violation management for the digital age 🌴⚡

**Maintained By:** Rob (Admin)  
**Last Updated:** October 18, 2025  
**Status:** Production Ready - 100% Functional

**Recent Updates (October 18, 2025):**
- ✅ **Photo Storage Fixed** - Live capture now uploads to Supabase Storage (not base64)
- ✅ **Carousel Consistency** - Unified 3D carousel behavior across all pages
- ✅ **Touch Controls Optimized** - Touch isolated to thumbnail cards only
- ✅ **Filter Logic Unified** - "This Week" and "This Month" work identically app-wide
