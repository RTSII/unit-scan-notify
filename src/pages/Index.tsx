import { useState, useEffect } from "react";
import { Camera, FileText, Download, LogOut, Settings, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import CameraCapture from "@/components/CameraCapture";
import DetailsPrevious from "@/components/DetailsPrevious";
import ExportCenter from "@/components/ExportCenter";
import AdminInvites from "@/components/AdminInvites";
type TabType = 'capture' | 'template' | 'export' | 'admin';
const Index = () => {
  const {
    user,
    loading,
    signOut,
    profile
  } = useAuth();
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
    return <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>;
  }
  const tabs = [{
    id: 'capture' as TabType,
    label: 'Capture',
    icon: Camera
  }, {
    id: 'template' as TabType,
    label: 'Details',
    icon: FileText
  }, {
    id: 'export' as TabType,
    label: 'Export',
    icon: Download
  }, ...(profile?.role === 'admin' ? [{
    id: 'admin' as TabType,
    label: 'Admin',
    icon: Settings
  }] : [])];
  const renderContent = () => {
    switch (activeTab) {
      case 'capture':
        return <CameraCapture />;
      case 'template':
        // Dashboard Details tab should show black UI with blank fields
        return <DetailsPrevious blankMode={true} />;
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
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/10"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => {
                setActiveTab(tab.id);
                navigate(`/dashboard?tab=${tab.id}`);
              }}
              className={`
                flex items-center space-x-2 
                ${activeTab === tab.id 
                  ? 'bg-gradient-primary text-white' 
                  : 'border-vice-cyan/30 text-vice-cyan hover:bg-vice-cyan/10'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="w-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
export default Index;