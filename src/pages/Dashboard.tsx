import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, FileText, Camera, Download, Settings } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: "url('https://images.pexels.com/photos/2832382/pexels-photo-2832382.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')"
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col justify-center items-center min-h-screen py-6 px-4 z-30">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Welcome to Dashboard</h1>
          <p className="text-vice-cyan/80">Your SPR management center</p>
        </div>
      </div>

      {/* Bottom center hamburger menu */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        {/* Navigation buttons - expand vertically upward */}
        {isMenuOpen && (
          <>
            <Button
              className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-vice-blue/80 hover:bg-vice-blue border-2 border-vice-cyan/50 backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-bottom-4"
              style={{ animationDelay: '0ms' }}
            >
              <FileText className="h-5 w-5 text-white" />
            </Button>
            
            <Button
              className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-vice-purple/80 hover:bg-vice-purple border-2 border-vice-pink/50 backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-bottom-4"
              style={{ animationDelay: '100ms' }}
            >
              <Camera className="h-5 w-5 text-white" />
            </Button>
            
            <Button
              className="absolute bottom-44 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-vice-pink/80 hover:bg-vice-pink border-2 border-vice-orange/50 backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-bottom-4"
              style={{ animationDelay: '200ms' }}
            >
              <Download className="h-5 w-5 text-white" />
            </Button>
            
            <Button
              className="absolute bottom-56 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-vice-orange/80 hover:bg-vice-orange border-2 border-vice-cyan/50 backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-bottom-4"
              style={{ animationDelay: '300ms' }}
            >
              <Settings className="h-5 w-5 text-white" />
            </Button>
          </>
        )}

        {/* Hamburger toggle button */}
        <Button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 border-2 border-vice-cyan/50 backdrop-blur-sm transition-all duration-300"
        >
          <Menu className={`h-6 w-6 text-vice-cyan transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`} />
        </Button>
      </div>
    </div>
  );
}