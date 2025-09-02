import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Power } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CameraCapture = () => {
  const navigate = useNavigate();
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [captureState, setCaptureState] = useState<'initial' | 'confirm'>('initial');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


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
        
        // Store captured image in sessionStorage to pass to details page
        sessionStorage.setItem('capturedImage', imageDataUrl);
        console.log('Photo captured successfully');
      }
    }
    // Navigate to details-live page instead of showing inline details
    navigate('/details-live');
    setCaptureState('initial');
  };


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
              onClick={() => navigate('/details-live')}
            >
              <span className="material-symbols-outlined">description</span>
              <span className="text-xs font-medium">Details</span>
            </button>
            <button 
              className="flex flex-col items-center gap-1 text-[var(--primary-color)]"
              onClick={() => navigate('/export')}
            >
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