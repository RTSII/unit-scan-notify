import { useState } from "react";
import { Camera, FileText, Download, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import CameraCapture from "@/components/CameraCapture";
import ViolationTemplate from "@/components/ViolationTemplate";
import ExportCenter from "@/components/ExportCenter";

type TabType = 'capture' | 'template' | 'export';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('capture');

  const tabs = [
    { id: 'capture' as TabType, label: 'Capture', icon: Camera },
    { id: 'template' as TabType, label: 'Notice', icon: FileText },
    { id: 'export' as TabType, label: 'Export', icon: Download },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'capture':
        return <CameraCapture />;
      case 'template':
        return <ViolationTemplate />;
      case 'export':
        return <ExportCenter />;
      default:
        return <CameraCapture />;
    }
  };

  return (
    <div className="w-full relative">
      {/* Preview Link for Sign In Page */}
      <div className="absolute top-4 right-4 z-50">
        <Link to="/signin">
          <Button variant="outline" size="sm" className="bg-black/50 border-vice-cyan/50 text-white hover:bg-vice-cyan/20">
            <LogIn className="w-4 h-4 mr-2" />
            Preview Sign In
          </Button>
        </Link>
      </div>
      {renderContent()}
    </div>
  );
};

export default Index;