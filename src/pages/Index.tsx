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
    <div className="h-screen bg-[var(--background-color)] flex flex-col">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div></div>
            <h1 className="text-xl font-semibold text-white">Capture</h1>
            <button className="p-2">
              <span className="material-symbols-outlined text-white">home</span>
            </button>
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