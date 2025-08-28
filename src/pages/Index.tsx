import { useState } from "react";
import { Camera, FileText, Download, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="w-full">
      {renderContent()}
    </div>
  );
};

export default Index;