import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TwentyFirstToolbar } from '@21st-extension/toolbar-react';
import { ReactPlugin } from '@21st-extension/react';

import { AuthProvider, useAuth } from '@/hooks/useAuth';
// Temporarily disabled: import { Toaster } from '@/components/ui/toaster';
// Temporarily disabled: import { Toaster as SonnerToaster } from '@/components/ui/sonner';

// Import pages
import Dashboard from '@/pages/Dashboard';
import Auth from '@/pages/Auth';
import Capture from '@/pages/Capture';
import DetailsLive from '@/pages/DetailsLive';
import DetailsPrevious from '@/pages/DetailsPrevious';
import Books from '@/pages/Books';
import Export from '@/pages/Export';
import Admin from '@/pages/Admin';
import Tutorial from '@/pages/Tutorial';
import NotFound from '@/pages/NotFound';

function ToolbarWrapper() {
  const location = useLocation();
  const { profile, user } = useAuth();
  
  // Toolbar toggle persisted to localStorage
  const [toolbarEnabled, setToolbarEnabled] = useState<boolean>(() => {
    try {
      const v = typeof window !== 'undefined' ? window.localStorage.getItem('toolbarEnabled') : null;
      return v === null ? true : v === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('toolbarEnabled', String(toolbarEnabled));
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        // Persist failures are non-blocking (e.g. private browsing); surface in dev for visibility.
        console.warn('Unable to persist toolbar preference', error);
      }
    }
  }, [toolbarEnabled]);

  // Check if we're on the Admin page and user is the specific admin (rob@ursllc.com)
  const isAdminPage = location.pathname === '/admin';
  const isSpecificAdmin = profile?.role === 'admin' && user?.email === 'rob@ursllc.com';
  
  // Enable toolbar in dev mode OR on Admin page for specific admin (in any build)
  const shouldEnableToolbar = toolbarEnabled && (import.meta.env.DEV || (isAdminPage && isSpecificAdmin));
  
  // Show toggle button in dev mode OR on Admin page for specific admin
  const shouldShowToggle = import.meta.env.DEV || (isAdminPage && isSpecificAdmin);

  return (
    <>
      {/* 21st.dev Toolbar: dev mode OR admin page for admin users */}
      <TwentyFirstToolbar
        enabled={shouldEnableToolbar}
        config={{
          plugins: [
            // React plugin enables selection/annotation of React elements in the browser
            ReactPlugin,
          ],
        }}
      />
      {shouldShowToggle && (
        <button
          type="button"
          onClick={() => setToolbarEnabled((v) => !v)}
          className="fixed bottom-4 right-4 z-50 rounded-full bg-black/70 text-xs text-white px-3 py-2 border border-vice-cyan/40 shadow-[0_0_8px_#00ffff60] hover:bg-black/80"
          aria-pressed={toolbarEnabled}
          aria-label="Toggle 21st.dev Toolbar"
        >
          21st Toolbar: {toolbarEnabled ? 'On' : 'Off'}
        </button>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/details-live" element={<DetailsLive />} />
            <Route path="/details-previous" element={<DetailsPrevious />} />
            <Route path="/books" element={<Books />} />
            <Route path="/export" element={<Export />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <ToolbarWrapper />
      </Router>
      {/* <Toaster /> */}
      {/* <SonnerToaster /> */}
    </AuthProvider>
  );
}

export default App;
