import { useState, useEffect } from "react";
import { Camera, FileText, Download, LogOut, Settings, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import CameraCapture from "@/components/CameraCapture";
import ViolationTemplate from "@/components/ViolationTemplate";
import ExportCenter from "@/components/ExportCenter";
import AdminInvites from "@/components/AdminInvites";

type TabType = 'capture' | 'template' | 'export' | 'admin';

const Index = () => {
  const { user, loading, signOut, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('capture');

  // Set active tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['capture', 'template', 'export', 'admin'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'capture' as TabType, label: 'Capture', icon: Camera },
    { id: 'template' as TabType, label: 'Notice', icon: FileText },
    { id: 'export' as TabType, label: 'Export', icon: Download },
    ...(profile?.role === 'admin' ? [{ id: 'admin' as TabType, label: 'Admin', icon: Settings }] : []),
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'capture':
        return <CameraCapture />;
      case 'template':
        return <ViolationTemplate />;
      case 'export':
        return <ExportCenter />;
      case 'admin':
        return <AdminInvites />;
      default:
        return <CameraCapture />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-vice-cyan/20">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigate('/')}
            variant="outline" 
            size="sm" 
            className="bg-black/30 border-vice-cyan/50 text-white hover:bg-vice-cyan/20"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <h1 className="text-2xl font-bold vice-block-letters">SPR</h1>
          <span className="text-vice-cyan">Vice City</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white text-sm">
            Welcome, <span className="text-vice-pink">{profile?.full_name || user?.email}</span>
          </span>
          <Button 
            onClick={signOut}
            variant="outline" 
            size="sm" 
            className="bg-black/30 border-vice-cyan/50 text-white hover:bg-vice-cyan/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center p-4">
        <div className="flex bg-black/30 rounded-lg p-1 backdrop-blur-sm border border-vice-cyan/20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-vice-pink text-white'
                    : 'text-vice-cyan hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;