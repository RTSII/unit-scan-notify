import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
      {/* <Toaster /> */}
      {/* <SonnerToaster /> */}
    </AuthProvider>
  );
}

export default App;