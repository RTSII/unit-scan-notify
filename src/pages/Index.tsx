import { useState } from "react";
import { Camera, FileText, Download } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            Violation Notice Manager
          </h1>
          <div className="text-sm text-muted-foreground">
            Sandpiper Run
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;