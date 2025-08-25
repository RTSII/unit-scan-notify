import { useState, useRef, useCallback } from "react";
import { Camera, MapPin, Crosshair, Image as ImageIcon, X, Wrench, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import TargetSizeSelector from "@/components/TargetSizeSelector";
import { Dock } from "@/components/ui/dock";
import type { DockItemData } from "@/components/ui/dock";

type TargetSize = 'small' | 'medium' | 'large';

const CameraCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [targetSize, setTargetSize] = useState<TargetSize>('medium');
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [showTargetOverlay, setShowTargetOverlay] = useState(false);
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 }); // Percentage from top-left
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

    // Get image data with metadata
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

  const handleCaptureClick = () => {
    setIsCapturing(true);
    setTimeout(() => capturePhoto(), 150);
  };

  const handleToolClick = () => {
    setShowToolPanel(!showToolPanel);
    if (showTargetPanel) setShowTargetPanel(false);
  };

  const handleTargetClick = () => {
    setShowTargetPanel(!showTargetPanel);
    setShowTargetOverlay(!showTargetOverlay);
  };

  const clearContent = () => {
    setShowTargetOverlay(false);
    setShowToolPanel(false);
    setShowTargetPanel(false);
    setLocation(null);
    setTargetPosition({ x: 50, y: 50 });
  };

  // Touch event handlers for movable target
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

  const dockItems: DockItemData[] = [
    {
      icon: <Wrench className="w-6 h-6 text-blue-500" />,
      label: "Tools",
      onClick: handleToolClick,
    },
    {
      icon: <Camera className="w-6 h-6 text-blue-500" />,
      label: "Capture",
      onClick: handleCaptureClick,
    },
    {
      icon: <ImageIcon className="w-6 h-6 text-blue-500" />,
      label: "Gallery",
      onClick: () => {},
    },
    {
      icon: <Trash2 className="w-6 h-6 text-blue-500" />,
      label: "Clear",
      onClick: clearContent,
    },
  ];

  return (
    <div 
      ref={cameraContainerRef}
      className="relative h-screen bg-black overflow-hidden camera-container pt-16"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Camera Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={startCamera}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
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
          {/* Center Aiming Marker */}
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

      {/* Dock at Bottom */}
      <Dock 
        items={dockItems}
        className="bottom-0 mb-2"
        baseItemSize={56}
        magnification={72}
        panelHeight={80}
      />

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
  );
};

export default CameraCapture;