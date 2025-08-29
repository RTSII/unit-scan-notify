import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Camera } from "lucide-react";

const CameraCapture = () => {
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [captureState, setCaptureState] = useState<'initial' | 'confirm'>('initial');
  const [showDetails, setShowDetails] = useState(false);
  
  // Form state for Details tab
  const [formData, setFormData] = useState({
    date: '',
    unit: '',
    time: '',
    violationTypes: {
      itemsOutside: false,
      trashOutside: false
    },
    description: ''
  });
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-generate current date and time
  useEffect(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    setFormData(prev => ({
      ...prev,
      date: `${month}/${day}`,
      time: `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`
    }));
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const handlePowerClick = () => {
    if (isPowerOn) {
      stopCamera();
      setIsPowerOn(false);
    } else {
      startCamera();
      setIsPowerOn(true);
    }
  };

  const handleCaptureClick = () => {
    if (captureState === 'initial') {
      setCaptureState('confirm');
    }
  };

  const handleCancelCapture = () => {
    setCaptureState('initial');
  };

  const handleConfirmCapture = () => {
    // Handle photo capture logic here - simulate adding captured image
    console.log('Photo captured');
    setCapturedImages(prev => [...prev, 'captured_image_' + Date.now()]); // Add captured image
    setShowDetails(true);
    setCaptureState('initial');
  };

  const handleBackFromDetails = () => {
    setShowDetails(false);
  };

  if (showDetails) {
    return (
      <div className="fixed inset-0 bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col overflow-hidden z-20">
        {/* Details Header */}
        <header className="bg-black/50 backdrop-blur-sm flex-shrink-0 z-10">
          <div className="flex justify-between items-center h-20 px-4">
            <button className="p-2" onClick={handleBackFromDetails}>
              <span className="material-symbols-outlined text-white">arrow_back_ios_new</span>
            </button>
            <h1 className="text-xl font-semibold">Details</h1>
            <button className="p-2">
              <span className="material-symbols-outlined text-white">home</span>
            </button>
          </div>
        </header>

        {/* Details Content */}
        <main className="flex-1 p-4 overflow-auto">
          <div className="max-w-md mx-auto space-y-4">
            {/* Form Title */}
            <h2 className="text-2xl font-semibold text-center mb-6">Violation Notice</h2>
            
            {/* Date and Unit Row */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date</label>
                <Input
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  placeholder="MM/DD"
                  className="bg-[var(--surface-color)] border-[var(--accent-color)] text-white h-12 text-base"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Unit</label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="e.g. B2G"
                  className="bg-[var(--surface-color)] border-[var(--accent-color)] text-white h-12 text-base"
                />
              </div>
            </div>

            {/* Time Row */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Time</label>
                <Input
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  placeholder="00:00 AM/PM"
                  className="bg-[var(--surface-color)] border-[var(--accent-color)] text-white h-12 text-base"
                />
              </div>
              <div className="flex-1">
                {/* Empty space to align time under date */}
              </div>
            </div>

            {/* Violation Types */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">Violation Type (Select applicable)</label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="items-outside"
                    checked={formData.violationTypes.itemsOutside}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        violationTypes: { ...prev.violationTypes, itemsOutside: !!checked }
                      }))
                    }
                    className="border-[var(--accent-color)] data-[state=checked]:bg-[var(--primary-color)]"
                  />
                  <label htmlFor="items-outside" className="text-white text-base cursor-pointer">
                    Items left outside Unit entry
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="trash-outside"
                    checked={formData.violationTypes.trashOutside}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        violationTypes: { ...prev.violationTypes, trashOutside: !!checked }
                      }))
                    }
                    className="border-[var(--accent-color)] data-[state=checked]:bg-[var(--primary-color)]"
                  />
                  <label htmlFor="trash-outside" className="text-white text-base cursor-pointer">
                    Trash left outside Unit entry
                  </label>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter additional details..."
                className="bg-[var(--surface-color)] border-[var(--accent-color)] text-white min-h-[100px] text-base resize-none"
                rows={4}
              />
            </div>

            {/* Image Attachments */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">Photo Evidence</label>
              <div className="space-y-3">
                {/* Captured Image */}
                {capturedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {capturedImages.map((image, index) => (
                      <Card key={index} className="bg-[var(--surface-color)] border-[var(--accent-color)]">
                        <CardContent className="p-2">
                          <div className="aspect-square bg-gray-700 rounded flex items-center justify-center">
                            <Camera className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 text-center">
                            Image {index + 1}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Add Image Button */}
                <Card className="bg-[var(--surface-color)] border-[var(--accent-color)] border-dashed cursor-pointer hover:bg-[var(--accent-color)]/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-[var(--primary-color)] flex items-center justify-center">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">Add Image</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {/* Details Footer */}
        <footer className="bg-black/50 backdrop-blur-sm flex-shrink-0 pb-safe-bottom">
          <nav className="border-t border-[var(--accent-color)]">
            <div className="flex justify-around items-center h-16">
              <button 
                className="flex flex-col items-center gap-1 text-[var(--text-secondary)]"
                onClick={handleBackFromDetails}
              >
                <span className="material-symbols-outlined">photo_camera</span>
                <span className="text-xs font-medium">Capture</span>
              </button>
              <div className="flex flex-col items-center gap-1 text-[var(--primary-color)]">
                <span className="material-symbols-outlined font-bold">description</span>
                <span className="text-xs font-semibold">Details</span>
              </div>
              <button className="flex flex-col items-center gap-1 text-[var(--text-secondary)]">
                <span className="material-symbols-outlined">ios_share</span>
                <span className="text-xs font-medium">Export</span>
              </button>
            </div>
          </nav>
        </footer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm flex-shrink-0 z-10">
        <div className="flex justify-between items-center h-20 px-4">
          <div></div>
          <h1 className="text-xl font-semibold text-white">Capture</h1>
          <button className="p-2">
            <span className="material-symbols-outlined text-white">home</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center bg-gray-900 overflow-hidden">
        {/* Camera Off State */}
        {!isPowerOn && (
          <div className="text-center">
            <span className="material-symbols-outlined text-gray-600 text-9xl">photo_camera</span>
            <p className="text-[var(--text-secondary)] mt-2">Camera is off</p>
          </div>
        )}

        {/* Camera On State */}
        {isPowerOn && (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <p className="text-white relative z-10">Live Camera Preview</p>
          </div>
        )}

        {/* Hidden Canvas for Photo Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </main>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-sm flex-shrink-0 pb-safe-bottom">
        {/* Capture Confirm State */}
        {captureState === 'confirm' && (
          <div className="flex justify-center py-4">
            <div className="flex gap-16">
              <button 
                className="w-16 h-16 bg-[var(--color-red)] rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-transform"
                onClick={handleCancelCapture}
              >
                <span className="material-symbols-outlined text-white text-4xl">close</span>
              </button>
              <button 
                className="w-16 h-16 bg-[var(--color-green)] rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-transform"
                onClick={handleConfirmCapture}
              >
                <span className="material-symbols-outlined text-white text-4xl">check</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Controls */}
        <div className="flex justify-between items-center h-28 px-4">
          {/* Power Button */}
          <button className="p-2" onClick={handlePowerClick}>
            <span 
              className={`material-symbols-outlined text-3xl ${
                isPowerOn ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'
              }`}
            >
              power_settings_new
            </span>
          </button>

          {/* Capture Button - Only show in initial state */}
          {captureState === 'initial' && (
            <div className="flex-grow flex justify-center">
              <button 
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-transform"
                onClick={handleCaptureClick}
                disabled={!isPowerOn}
              >
                <div className="w-18 h-18 bg-white rounded-full border-4 border-black"></div>
              </button>
            </div>
          )}

          {/* Settings Button */}
          <button className="p-2">
            <span className="material-symbols-outlined text-white text-3xl">build</span>
          </button>
        </div>

        {/* Bottom Navigation */}
        <nav className="border-t border-[var(--accent-color)]">
          <div className="flex justify-around items-center h-16">
            <div className="flex flex-col items-center gap-1 text-[var(--primary-color)]">
              <span className="material-symbols-outlined font-bold">photo_camera</span>
              <span className="text-xs font-semibold">Capture</span>
            </div>
            <button className="flex flex-col items-center gap-1 text-[var(--text-secondary)]">
              <span className="material-symbols-outlined">description</span>
              <span className="text-xs font-medium">Details</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-[var(--text-secondary)]">
              <span className="material-symbols-outlined">ios_share</span>
              <span className="text-xs font-medium">Export</span>
            </button>
          </div>
        </nav>
      </footer>
    </div>
  );
};

export default CameraCapture;