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
    const isBlankMode = searchParams.get('blank') === 'true';
    switch (activeTab) {
      case 'capture':
        return <CameraCapture />;
      case 'template':
        // Show blank fields for the Details tab from dashboard
        return <DetailsPrevious blankMode={false} />;
      case 'export':
        return <ExportCenter />;
      case 'admin':
        return <AdminInvites />;
      default:
        return <CameraCapture />;
    }
  };
  return;
};
export default Index;