# GEMINI.md: Project Context for AI Agent

## 1. Project Overview

This project, "SPR Vice City," is a mobile-first web application for managing property violation notices. It's designed for a property management team to capture, document, and manage violations in the field. The application has a distinct "Vaporwave retro-futuristic" aesthetic.

- **Frontend:** Built with React 18, TypeScript, and Vite.
- **Styling:** Uses Tailwind CSS with `shadcn/ui` for components.
- **Backend:** Powered by Supabase, handling the PostgreSQL database, user authentication, and storage.
- **Routing:** `react-router-dom` is used for client-side routing.
- **State Management:** Primarily uses React Hooks and a custom `useAuth` context.

### Key Features
- **Mobile-First Design:** Optimized for modern iPhones.
- **Violation Capture:** Integrates with the device camera to allow users to take photos of violations.
- **Form Management:** A comprehensive system for filling out and submitting violation details.
- **User Authentication:** An invite-only system with role-based access.
- **Admin Dashboard:** A section for administrators to view team statistics, manage users, and oversee all violation forms.
- **"Books" Archive:** A searchable and filterable library of all past violations, presented with a unique 3D carousel interface.
- **Export Functionality:** Allows users to export violation notices to email or a printable format.

## 2. Page-by-Page Breakdown

### `Dashboard.tsx`
- **Purpose:** The main landing page and navigation hub for authenticated users.
- **Functionality:**
    - Displays a dynamic, radial menu for navigating to different sections of the app.
    - Menu items include `Books`, `Capture`, `Details`, `Export`, and a conditional `Admin` button for Rob, the sole 'admin'.
    - Features a user avatar that opens a dropdown menu with user information and a sign-out button.
    - The UI is heavily styled with a "Synthwave" aesthetic, including a background image and a central "Siri-like" orb to toggle the navigation menu.

### `Auth.tsx`
- **Purpose:** Handles user authentication.
- **Functionality:**
    - Provides forms for both sign-in and sign-up.
    - Supports email/password authentication and Google OAuth.
    - The sign-up process is invite-only, requiring a valid token.
    - Features a background gradient animation and a "glassmorphism" effect for the UI components.

### `Capture.tsx`
- **Purpose:** Provides a dedicated interface for capturing "live" violations and take photos to document them.
- **Functionality:**
    - Wraps the `CameraCapture` component, which presumably handles the device camera integration.
    - Allows users to take pictures that can be attached to violation forms.

### `DetailsLive.tsx`
- **Purpose:** A form for creating new violation notices in real-time.
- **Functionality:**
    - Includes fields for `Unit Number`, `Violation Type`, and a `Description`.
    - Violation types are pre-defined and can be selected via checkboxes (e.g., "Items/Trash left outside Unit").
    - The form can be saved, which creates a new entry in the `violation_forms` table.

### `DetailsPrevious.tsx`
- **Purpose:** To view or edit previously saved violation forms.
- **Functionality:**
    - This page component wraps a `DetailsPrevious` component, suggesting it's used to load and display data from an existing form.

### `Books.tsx`
- **Purpose:** Acts as a comprehensive archive of all submitted violation forms.
- **Functionality:**
    - Displays violation forms in a list format, which can be searched and filtered by status (`saved`, `completed`).
    - Features a unique 3D carousel (`ViolationCarousel`) for a more visual browsing experience of recent violations ("This Week" and "This Month").
    - Includes a "Full Library" modal that shows all violations in a detailed grid view.
    - Each violation card displays key information, including the unit number, date, description, and the user who created it.

### `Admin.tsx`
- **Purpose:** A centralized dashboard for administrative tasks, exclusively for use by Rob (`rob@ursllc.com`).
- **Functionality:**
    - This page is only accessible to the user with the `admin` role (Rob) and is linked from his `Dashboard` page. Any non-admin user attempting to access `/admin` will be redirected.
    - **Team Statistics:** Displays key metrics like total violations, violations this month, pending violations, and team completion rates.
    - **User Management:** Allows the admin to invite new users via email and view a list of all registered team members and their roles.
    - **Violation Management:** Provides a comprehensive view of all violation forms submitted by the team, with the ability to delete them.

### `Export.tsx`
- **Purpose:** Allows users to export their own violation notices.
- **Functionality:**
    - Users can select one or more of their saved violation forms.
    - Selected forms can be exported in two ways:
        1.  **Email:** Composes an email with the details of the selected notices.
        2.  **Print:** Generates a printable 2x2 grid layout for up to four selected notices.
    - The page includes search and filter options to help users find specific notices to export.

### `NotFound.tsx`
- **Purpose:** A fallback page for any routes that do not exist.
- **Functionality:**
    - Displays a standard "404 Not Found" message.
    - Provides a link to return to the home page.

## 3. Building and Running

Standard Node.js and npm workflows are used.

- **Install Dependencies:** `npm install`
- **Run Development Server:** `npm run dev` (starts on `http://localhost:3000`)
- **Create Production Build:** `npm run build`
- **Linting:** `npm run lint`

## 4. Core Concepts & Conventions

### Routing
The application uses `react-router-dom` for client-side routing. All routes are defined in `src/App.tsx`.

- **`/`**: The root path, which loads the `Dashboard` component. This is the main entry point for authenticated users.
- **`/auth`**: The authentication page, which loads the `Auth` component. This is where users can sign in or sign up.
- **`/capture`**: The `Capture` page, which loads the `Capture` component for taking photos.
- **`/details-live`**: The `DetailsLive` page, which loads the `DetailsLive` component for creating new violation forms.
- **`/details-previous`**: The `DetailsPrevious` page, which loads the `DetailsPrevious` component for viewing or editing existing forms.
- **`/books`**: The `Books` page, which loads the `Books` component, displaying a library of all violation forms.
- **`/export`**: The `Export` page, which loads the `Export` component for exporting violation notices.
- **`/admin`**: The `Admin` page, which loads the `Admin` component. This route is protected and only accessible to users with the `admin` role.
- **`*`**: A catch-all route that loads the `NotFound` component for any path that doesn't match the defined routes.

### Authentication and Security
- **Invite-Only:** New users can only register if they have a valid, un-used invite.
- **User Roles:** The system has two roles: `admin` and `user`.
  - The `admin` role is exclusively assigned to Rob (`rob@ursllc.com`) via a hardcoded database function. He is the sole administrator of the application.
  - All other team members are assigned the `user` role.
- **Row Level Security (RLS):** RLS is enabled on all tables.
  - `users` can only view and edit their own data.
  - `admins` have elevated permissions to view/edit all data.
  - For team transparency, all users are permitted to view all `violation_forms`.

### Database Management
- **Supabase CLI:** The project uses the Supabase CLI for database management, wrapped in npm scripts.
- **Creating Migrations:** To create a new database migration, use the command:
  ```bash
  npm run migrate:new "your migration description"
  ```
  This creates a new SQL file in the `supabase/migrations` directory.
- **Applying Migrations:** Since the project uses a hosted Supabase instance, migrations must be applied manually by copying the SQL from the migration file and running it in the Supabase Dashboard's SQL Editor.

### Mobile & Frontend Conventions
- **Responsive Design:** The app is specifically optimized for iPhone models (SE, 13, Pro, Pro Max), with custom breakpoints defined in `tailwind.config.ts`.
- **Safe Area Handling:** The UI accounts for device notches and home indicators using CSS `env(safe-area-inset-*)` variables.
- **Touch Targets:** UI elements adhere to a minimum `44px` touch target size for iOS accessibility.
- **Path Aliases:** The `@` symbol is an alias for the `src` directory.

### Deployment & Hosting
- **Platform:** The application is deployed on the `Lovable.dev` platform.

## 5. Project Status & Roadmap

- **Status:** The project is under active development and has a comprehensive feature set including a full admin panel and a professional database migration workflow.
- **Future Goals:** High-priority items on the roadmap include enhancing analytics/reporting, improving search/filtering, and implementing offline capabilities (PWA). A formal testing suite (Unit, Integration, E2E) is also planned.