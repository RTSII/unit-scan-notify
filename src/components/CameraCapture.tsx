import { useState, useRef, useCallback } from "react";
import { Camera, Power, Settings, MapPin, Crosshair, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TargetSizeSelector from "@/components/TargetSizeSelector";

type TargetSize = 'small' | 'medium' | 'large';

const CameraCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [targetSize, setTargetSize] = useState<TargetSize>('medium');
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [showTargetOverlay, setShowTargetOverlay] = useState(false);
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [showTargetPanel, setShowTargetPanel] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);

  const getTargetDimensions = (size: TargetSize) => {
    switch (size) {
      case 'small': return { width: 120, height: 120 };
      case 'medium': return { width: 180, height: 180 };
      case 'large': return { width: 240, height: 240 };
      default: return { width: 180, height: 180 };
    }
  };

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position),
        (error) => console.error('Error getting location:', error)
      );
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    const timestamp = new Date();
    
    console.log('Photo captured:', {
      imageData: imageData.substring(0, 50) + '...',
      timestamp,
      location,
      targetSize
    });

    setIsCapturing(false);
  }, [location, targetSize]);

  const handleCameraClick = async () => {
    if (!isCameraActive) {
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
          setIsCameraActive(true);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    } else {
      setIsCapturing(true);
      setTimeout(() => capturePhoto(), 150);
    }
  };

  const handlePowerClick = () => {
    setIsCameraActive(false);
    setShowTargetOverlay(false);
    setShowToolPanel(false);
    setShowTargetPanel(false);
    setLocation(null);
    setTargetPosition({ x: 50, y: 50 });
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleSettingsClick = () => {
    setShowToolPanel(!showToolPanel);
  };

  const handleTargetClick = () => {
    setShowTargetPanel(!showTargetPanel);
    setShowTargetOverlay(!showTargetOverlay);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!showTargetOverlay || !cameraContainerRef.current) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = cameraContainerRef.current.getBoundingClientRect();
    
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    
    setTargetPosition({ x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) });
    setIsDragging(true);
  }, [showTargetOverlay]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !cameraContainerRef.current) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = cameraContainerRef.current.getBoundingClientRect();
    
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    
    setTargetPosition({ x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) });
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const targetDimensions = getTargetDimensions(targetSize);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-900">
      {/* Main Camera Area */}
      <div 
        ref={cameraContainerRef}
        className="flex-1 relative bg-slate-800 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Camera Video or Off State */}
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <Camera className="w-20 h-20 mb-4" />
            <p className="text-lg">Camera is off</p>
          </div>
        )}

        {/* Hidden Canvas for Photo Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Target Overlay */}
        {showTargetOverlay && (
          <div
            className="absolute target-overlay rounded-lg border-2 border-primary pointer-events-none z-30"
            style={{
              left: `${targetPosition.x}%`,
              top: `${targetPosition.y}%`,
              width: targetDimensions.width,
              height: targetDimensions.height,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 0 2px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.5)',
            }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <X className="w-6 h-6 text-primary drop-shadow-lg" strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Tool Panel */}
        {showToolPanel && (
          <div className="absolute top-4 left-4 right-4 z-40">
            <Card className="bg-black/80 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    GPS
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTargetClick}
                    className={`bg-white/10 border-white/20 hover:bg-white/20 text-white ${showTargetOverlay ? 'bg-primary/30' : ''}`}
                  >
                    <Crosshair className="w-4 h-4 mr-2" />
                    Target
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Location Display */}
        {location && (
          <div className="absolute top-20 left-4 right-4 z-10">
            <Card className="bg-black/80 backdrop-blur-sm border-white/20">
              <CardContent className="p-3">
                <div className="text-green-400 font-medium text-sm">📍 Location Acquired</div>
                <div className="text-white/70 text-xs">
                  {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Target Size Selector */}
        {showTargetPanel && (
          <div className="absolute top-32 left-4 right-4 z-40">
            <Card className="bg-black/80 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <TargetSizeSelector
                  selectedSize={targetSize}
                  onSizeChange={setTargetSize}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status Indicator */}
        {isCapturing && (
          <div className="absolute inset-0 z-20 bg-white/20 flex items-center justify-center">
            <Card className="bg-black/80 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-lg font-medium text-white">Capturing Photo...</div>
                  <div className="text-sm text-white/70 mt-1">
                    Processing with AI detection
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Control Area */}
      <div className="bg-black py-6 px-8">
        <div className="flex items-center justify-center">
          {/* Power Button */}
          <Button
            variant="ghost"
            size="lg"
            onClick={handlePowerClick}
            className="text-white hover:bg-white/20 mr-8"
          >
            <Power className="w-6 h-6" />
          </Button>

          {/* Large Capture Button */}
          <Button
            onClick={handleCameraClick}
            className="w-16 h-16 rounded-full bg-white hover:bg-white/90 text-black p-0 shadow-lg"
          >
            <div className="w-3 h-3 bg-black rounded-full"></div>
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="lg"
            onClick={handleSettingsClick}
            className="text-white hover:bg-white/20 ml-8"
          >
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;