import { useState, useRef, useCallback } from "react";
import { Camera, MapPin, Crosshair, RotateCw, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import TargetSizeSelector from "@/components/TargetSizeSelector";

type TargetSize = 'small' | 'medium' | 'large';

const CameraCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [targetSize, setTargetSize] = useState<TargetSize>('medium');
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [showTargetOverlay, setShowTargetOverlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const targetDimensions = getTargetDimensions(targetSize);

  return (
    <div className="relative h-screen bg-black overflow-hidden camera-container">
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
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 target-overlay rounded-lg"
          style={{
            width: targetDimensions.width,
            height: targetDimensions.height,
          }}
        />
      )}

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="camera-controls flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            className="bg-white/90 border-white/20 hover:bg-white"
          >
            <MapPin className="w-4 h-4 mr-2" />
            GPS
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTargetOverlay(!showTargetOverlay)}
              className={`bg-white/90 border-white/20 hover:bg-white ${showTargetOverlay ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <Crosshair className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Location Display */}
      {location && (
        <div className="absolute top-20 left-4 right-4 z-10">
          <div className="camera-controls text-sm">
            <div className="text-green-600 font-medium">📍 Location Acquired</div>
            <div className="text-muted-foreground text-xs">
              {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </div>
          </div>
        </div>
      )}

      {/* Target Size Selector */}
      <div className="absolute top-32 left-4 right-4 z-10">
        <TargetSizeSelector
          selectedSize={targetSize}
          onSizeChange={setTargetSize}
        />
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-center gap-8">
          {/* Gallery Button */}
          <Button
            variant="outline"
            size="lg"
            className="bg-white/90 border-white/20 hover:bg-white rounded-full w-14 h-14"
          >
            <ImageIcon className="w-6 h-6" />
          </Button>

          {/* Capture Button */}
          <Button
            onClick={handleCaptureClick}
            disabled={isCapturing}
            className={`
              capture-button transition-all duration-150
              ${isCapturing ? 'animate-pulse-capture bg-primary' : ''}
            `}
          >
            <Camera className="w-6 h-6 text-black" />
          </Button>

          {/* Switch Camera Button */}
          <Button
            variant="outline"
            size="lg"
            className="bg-white/90 border-white/20 hover:bg-white rounded-full w-14 h-14"
          >
            <RotateCw className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Status Indicator */}
      {isCapturing && (
        <div className="absolute inset-0 z-20 bg-white/20 flex items-center justify-center">
          <div className="camera-controls px-6 py-3">
            <div className="text-center">
              <div className="text-lg font-medium">Capturing Photo...</div>
              <div className="text-sm text-muted-foreground mt-1">
                Processing with AI detection
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;