import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Camera, Power } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CameraCapture = () => {
  const navigate = useNavigate();
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [captureState, setCaptureState] = useState<'initial' | 'confirm'>('initial');
  const [showDetails, setShowDetails] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Form state for Details tab
  const [formData, setFormData] = useState({
    date: '',
    unit: '',
    time: '',
    violationTypes: {
      itemsOutside: false,
      trashOutside: false,
      balconyItems: false
    },
    balconyChoice: '', // 'balcony' or 'front'
    includePhotos: false,
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
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied. Please enable camera permissions in your browser settings.');
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
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Set canvas dimensions to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL (base64 image)
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Add captured image to state
        setCapturedImages(prev => [...prev, imageDataUrl]);
        console.log('Photo captured successfully');
      }
    }
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
            <button className="p-2" onClick={() => navigate('/')}>
              <span className="material-symbols-outlined text-white">home</span>
            </button>
          </div>
        </header>

        {/* Details Content */}
        <main className="flex-1 p-4 overflow-auto">
          <div className="max-w-md mx-auto space-y-4">
            
            {/* Date, Time & Unit Combined Row */}
            <div className="flex gap-3 items-end justify-center">
              <div className="w-20">
                <label className="block text-sm font-medium text-[var(--primary-color)] mb-1 text-center">Date</label>
                <Input
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  placeholder="MM/DD"
                  className="bg-[var(--surface-color)] border-[var(--accent-color)] text-white h-12 text-base text-center"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-[var(--primary-color)] mb-1 text-center">Time</label>
                <Input
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  placeholder="00:00 AM"
                  className="bg-[var(--surface-color)] border-[var(--accent-color)] text-white h-12 text-sm text-center"
                />
              </div>
              <div className="w-20">
                <label className="block text-sm font-medium text-[var(--primary-color)] mb-1 text-center">Unit</label>
                <Input
                  value={formData.unit}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase();
                    // Force 1st and 3rd characters to be uppercase letters if they exist
                    if (value.length >= 1) value = value.charAt(0).toUpperCase() + value.slice(1);
                    if (value.length >= 3) value = value.slice(0, 2) + value.charAt(2).toUpperCase() + value.slice(3);
                    setFormData(prev => ({ ...prev, unit: value }));
                  }}
                  maxLength={3}
                  className="bg-[var(--surface-color)] border-[var(--accent-color)] text-white h-12 text-base uppercase text-center font-semibold tracking-wider"
                />
              </div>
            </div>

            {/* Violation Types */}
            <div>
              <label className="block text-sm font-medium text-[var(--primary-color)] mb-3 text-center">Violation Type (Select applicable)</label>
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
                    Items left outside Unit
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
                    Trash left outside Unit
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="balcony-items"
                    checked={formData.violationTypes.balconyItems}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        violationTypes: { ...prev.violationTypes, balconyItems: !!checked },
                        balconyChoice: checked ? '' : ''
                      }))
                    }
                    className="border-[var(--accent-color)] data-[state=checked]:bg-[var(--primary-color)]"
                  />
                  <label htmlFor="balcony-items" className="text-white text-base cursor-pointer">
                    Items left on{' '}
                    {formData.violationTypes.balconyItems ? (
                      <span className="inline-flex gap-2 animate-pulse">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, balconyChoice: 'balcony' }))}
                          className={`px-2 py-1 rounded transition-all duration-300 ${
                            formData.balconyChoice === 'balcony' 
                              ? 'bg-[var(--primary-color)] text-white scale-105 shadow-lg' 
                              : 'bg-transparent border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)]/20'
                          }`}
                        >
                          balcony
                        </button>
                        <span className="text-[var(--text-secondary)]">/</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, balconyChoice: 'front' }))}
                          className={`px-2 py-1 rounded transition-all duration-300 ${
                            formData.balconyChoice === 'front' 
                              ? 'bg-[var(--primary-color)] text-white scale-105 shadow-lg' 
                              : 'bg-transparent border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)]/20'
                          }`}
                        >
                          front
                        </button>
                      </span>
                    ) : (
                      'balcony/front'
                    )}{' '}
                    railing
                  </label>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="p-1 hover:bg-[var(--accent-color)]/20 rounded-full transition-colors flex items-center justify-center"
                  >
                  <Power 
                    size={14} 
                    className={`transition-colors duration-200 ${
                      isDescriptionExpanded ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'
                    }`} 
                  />
                </button>
                <label className="block text-sm font-medium text-[var(--color-neon-fuscia)] ml-1.5">Description</label>
              </div>
              {isDescriptionExpanded && (
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter additional details..."
                  className="bg-[var(--surface-color)] border-[var(--accent-color)] text-white text-base resize-none transition-all duration-300"
                  rows={6}
                />
              )}
            </div>

            {/* Image Attachments */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, includePhotos: !prev.includePhotos }))}
                  className="p-1 hover:bg-[var(--accent-color)]/20 rounded-full transition-colors flex items-center justify-center"
                >
                  <Power 
                    size={14} 
                    className={`transition-colors duration-200 ${
                      formData.includePhotos ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'
                    }`} 
                  />
                </button>
                <label className="block text-sm font-medium text-[var(--color-neon-fuscia)] ml-1.5">Photo Evidence</label>
              </div>
              <div className="flex gap-3 items-center justify-center">
                {/* Captured Photo Display */}
                <Card className="bg-[var(--surface-color)] border-[var(--accent-color)] w-20 h-20 flex-shrink-0">
                  <CardContent className="p-1">
                    <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center relative overflow-hidden">
                      {capturedImages.length > 0 ? (
                        <img 
                          src={capturedImages[capturedImages.length - 1]} 
                          alt="Captured violation evidence"
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <Camera className="w-5 h-5 text-gray-500 mb-1" />
                          <span className="text-xs text-gray-500">Photo</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Add Image Button */}
                <Card className="bg-[var(--surface-color)] border-[var(--accent-color)] border-dashed cursor-pointer hover:bg-[var(--accent-color)]/20 transition-colors w-20 h-20 flex-shrink-0">
                  <CardContent className="p-1">
                    <div className="w-full h-full flex items-center justify-center">
                      <Plus className="w-6 h-6 text-[var(--primary-color)]" />
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
                className="flex flex-col items-center gap-1 text-[var(--primary-color)]"
                onClick={handleBackFromDetails}
              >
                <span className="material-symbols-outlined">photo_camera</span>
                <span className="text-xs font-medium">Capture</span>
              </button>
              <div className="flex flex-col items-center gap-1 text-[var(--color-green)]">
                <span className="material-symbols-outlined font-bold">description</span>
                <span className="text-xs font-semibold">Details</span>
              </div>
              <button className="flex flex-col items-center gap-1 text-[var(--primary-color)]">
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
          <button className="p-2" onClick={() => navigate('/')}>
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
              style={{ transform: 'scaleX(-1)' }}
            />
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
            <div className="flex flex-col items-center gap-1 text-[var(--color-green)]">
              <span className="material-symbols-outlined font-bold">photo_camera</span>
              <span className="text-xs font-semibold">Capture</span>
            </div>
            <button 
              className="flex flex-col items-center gap-1 text-[var(--primary-color)]"
              onClick={() => setShowDetails(true)}
            >
              <span className="material-symbols-outlined">description</span>
              <span className="text-xs font-medium">Details</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-[var(--primary-color)]">
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