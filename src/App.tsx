import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TwentyFirstToolbar } from '@21st-extension/toolbar-react';
import { ReactPlugin } from '@21st-extension/react';

import { AuthProvider } from '@/hooks/useAuth';
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
import NotFound from '@/pages/NotFound';

function App() {
  // Dev-only toolbar toggle persisted to localStorage
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
    } catch {}
  }, [toolbarEnabled]);
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
      {/* 21st.dev Toolbar: dev-only with toggle */}
      <TwentyFirstToolbar
        enabled={import.meta.env.DEV && toolbarEnabled}
        config={{
          plugins: [
            // React plugin enables selection/annotation of React elements in the browser
            ReactPlugin,
          ],
        }}
      />
      {import.meta.env.DEV && (
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
      {/* <Toaster /> */}
      {/* <SonnerToaster /> */}
    </AuthProvider>
  );
}

export default App;