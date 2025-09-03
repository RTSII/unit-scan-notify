# SPR Vice City - Mobile Violation Management App

## Project Overview

**SPR Vice City** is a mobile-first violation notice management application designed for field operations. Built with a retro-futuristic Vice City aesthetic, this app enables property management teams to capture, document, and manage violation notices efficiently on mobile devices.

**Live URL**: https://lovable.dev/projects/22649cbf-4588-41b8-adc2-962a2e3dd1da

## Features

### 🎯 Core Functionality
- **Mobile Camera Integration**: Real-time photo capture with confirmation workflow
- **Violation Form Management**: Comprehensive form system for documenting violations
- **User Authentication**: Secure invite-only registration system with role-based access
- **Data Export**: Email and print export capabilities for violation notices
- **Books Library**: Searchable archive of all saved violation forms

### 📱 Mobile-Optimized Design
- **Responsive Layout**: Fully optimized for iOS and Android devices
- **Touch-Friendly Interface**: Minimum 44px touch targets for accessibility
- **Safe Area Support**: Proper handling of device notches and home indicators
- **Viewport Optimization**: Uses `dvh` units for consistent full-screen experience

### 🎨 Vice City Theme
- **Retro-Futuristic Design**: Neon colors, gradients, and cyberpunk aesthetics
- **Custom Typography**: Orbitron and Righteous fonts with neon glow effects
- **Animated Elements**: Subtle animations and hover states
- **Color Palette**: Vice purple, pink, cyan, blue, and orange theme

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with invite system
- **State Management**: React Query + Context API
- **Routing**: React Router DOM
- **Icons**: Lucide React + Material Symbols

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AdminInvites.tsx # Admin invite management
│   ├── CameraCapture.tsx # Camera functionality
│   └── DetailsPrevious.tsx # Form details component
├── pages/              # Route components
│   ├── Dashboard.tsx   # Main dashboard with hamburger menu
│   ├── Auth.tsx        # Authentication page
│   ├── Capture.tsx     # Camera capture page
│   ├── Books.tsx       # Violation forms library
│   ├── Export.tsx      # Export functionality
│   ├── Admin.tsx       # Admin panel
│   ├── DetailsLive.tsx # Live form details
│   └── DetailsPrevious.tsx # Previous form details
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication context
│   └── use-toast.ts    # Toast notifications
└── integrations/       # External service integrations
    └── supabase/       # Supabase client and types
```

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
- **Confirmation Workflow**: Two-step capture process (capture → confirm)
- **Session Storage**: Temporarily stores captured images during form completion

### Form Management
- **Auto-Population**: Live details auto-fill current date/time
- **Validation**: Ensures required fields and violation types are selected
- **Status Tracking**: Forms can be saved as drafts or marked complete

### Export System
- **Email Export**: Generates formatted email with violation details
- **Print Layout**: 2x2 grid layout optimized for printing (max 4 forms)
- **Batch Operations**: Select multiple forms for bulk export

## Mobile Optimization

### iOS Compatibility
- Prevents zoom on input focus (16px font size)
- Handles safe areas for notched devices
- Optimized touch targets and gestures

### Android Compatibility
- Chrome address bar handling
- Touch action optimization
- Proper viewport configuration

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
- **Responsive Design**: Mobile-first approach with desktop enhancements

## Deployment

### Bolt Hosting
Simply open the [Lovable Project](https://lovable.dev/projects/22649cbf-4588-41b8-adc2-962a2e3dd1da) and click Share → Publish.

### Custom Domain
Navigate to Project > Settings > Domains to connect a custom domain.
[Domain Setup Guide](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Security Features

- **Invite-Only Registration**: Prevents unauthorized access
- **Row Level Security**: Database-level access control
- **Role-Based Permissions**: Admin and user role separation
- **Session Management**: Secure authentication state handling

## Browser Support

- **Modern Browsers**: Chrome 90+, Safari 14+, Firefox 88+
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Camera API**: Requires HTTPS for camera access in production

## Contributing

This project follows mobile-first development principles. When making changes:
1. Test on actual mobile devices
2. Ensure touch targets meet accessibility standards
3. Verify camera functionality across different devices
4. Maintain the Vice City aesthetic theme

## Support

For technical issues or feature requests, refer to the Lovable platform documentation or contact the development team.

---

## Chat History Summary & AI Prompt

### Development History
This project was developed through the following key iterations:

1. **Initial Setup**: Started with a basic Vite React TypeScript template
2. **Authentication System**: Implemented Supabase authentication with invite-only registration
3. **Mobile Optimization**: Configured the app specifically for mobile devices with proper viewport handling
4. **Vice City Theme**: Applied retro-futuristic styling with neon colors and custom fonts
5. **Core Features**: Built camera capture, violation forms, books library, and export functionality
6. **Dashboard Design**: Created a hamburger menu with semi-circle button layout
7. **Bug Fixes**: Resolved JSX parsing errors and component structure issues
8. **Background Update**: Replaced animated effects with static 2.jpeg background image
9. **Button Spacing**: Fixed overlapping issues in the semi-circle menu layout

### AI Prompt for Project Duplication

When duplicating this project, use this prompt to ensure the AI understands the project context:

```
This is SPR Vice City, a mobile-first violation notice management application for field operations. 

Key project requirements:
- Mobile-optimized for iOS and Android devices exclusively
- Vice City retro-futuristic aesthetic with neon colors (vice-purple, vice-pink, vice-cyan, vice-blue)
- Supabase backend with invite-only authentication system
- Camera integration for violation photo capture
- Form management system for violation notices
- Export capabilities (email/print)
- Books library for saved forms
- Dashboard with hamburger menu and semi-circle button layout
- Uses 2.jpeg as background image without animated effects
- All UI must be fully visible on mobile screens without content cutoff
- Touch targets minimum 44px for accessibility
- Export capabilities (email/print)
- Books library for saved forms
- Uses 2.jpeg as background image without animated effects
- All UI must be fully visible on mobile screens without content cutoff
- Touch targets minimum 44px for accessibility
- Uses Work Sans font family and Material Symbols

Focus on the dashboard layout fixes first, then ensure all other pages maintain mobile optimization.
*Built with ❤️ using Lovable and optimized for mobile field operations*