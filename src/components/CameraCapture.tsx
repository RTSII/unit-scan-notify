import { useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Power, Home, Settings, Camera, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CameraCapture = () => {
  const navigate = useNavigate();
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [captureState, setCaptureState] = useState<'initial' | 'confirm' | 'continue-prompt'>('initial');
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>('');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [isUsingFrontCamera, setIsUsingFrontCamera] = useState(false);
  
  const MAX_PHOTOS = 4;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    console.log('Starting camera...');
    setCameraError('');

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available in this browser');
      }

      // First check for camera permissions explicitly
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('Camera permission status:', permissionStatus.state);
      } catch (permErr) {
        console.log('Permission query not supported, continuing...');
      }

      // Simplified constraints that work better on iOS
      const constraints = [
        // Try rear camera first (environment) - what user wants
        {
          video: { 
            facingMode: { exact: 'environment' }
          },
          audio: false
        },
        // Fallback to rear camera with ideal (less strict)
        {
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        },
        // Fallback to front camera if rear not available
        {
          video: { 
            facingMode: { ideal: 'user' },
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        },
        // Most basic constraint as last resort
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        },
        // Ultimate fallback
        {
          video: true,
          audio: false
        }
      ];

      let stream = null;
      let usingFrontCamera = false;
      let successfulConstraint = null;

      for (let i = 0; i < constraints.length; i++) {
        const constraint = constraints[i];
        try {
          console.log(`Trying camera constraint ${i + 1}/${constraints.length}:`, JSON.stringify(constraint));
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          successfulConstraint = constraint;
          
          // Determine camera type based on successful constraint
          if (constraint.video && typeof constraint.video === 'object') {
            const facingMode = constraint.video.facingMode;
            if (facingMode) {
              if (typeof facingMode === 'string') {
                usingFrontCamera = facingMode === 'user';
              } else if (typeof facingMode === 'object') {
                if ('exact' in facingMode && facingMode.exact) {
                  usingFrontCamera = facingMode.exact === 'user';
                } else if ('ideal' in facingMode && facingMode.ideal) {
                  usingFrontCamera = facingMode.ideal === 'user';
                }
              }
            }
          }
          
          console.log(`Camera constraint ${i + 1} succeeded`);
          break;
        } catch (err) {
          console.log(`Camera constraint ${i + 1} failed:`, err);
          continue;
        }
      }

      if (!stream) {
        throw new Error('Unable to access camera with any constraints. Please ensure camera permissions are granted.');
      }

      console.log('Camera stream obtained:', stream.getTracks().length, 'tracks');
      console.log('Using front camera:', usingFrontCamera);
      console.log('Successful constraint:', JSON.stringify(successfulConstraint));

      // Get video track info
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log('Video track settings:', settings);
        
        // Try to determine camera facing from track settings
        if ('facingMode' in settings && typeof settings.facingMode === 'string') {
          usingFrontCamera = settings.facingMode === 'user';
          console.log('Camera facing mode from track settings:', settings.facingMode);
        }
      }

      setIsUsingFrontCamera(usingFrontCamera);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Add event listeners for better debugging
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          console.log('Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
        };
        
        videoRef.current.oncanplay = () => {
          console.log('Video can start playing');
        };
        
        videoRef.current.onerror = (e) => {
          console.error('Video element error:', e);
        };

        try {
          await videoRef.current.play();
          console.log('Camera started successfully');
          console.log('Final video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        } catch (playError) {
          console.error('Error playing video:', playError);
          throw new Error('Failed to start video playback');
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Camera access failed. ';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Please allow camera access when prompted and refresh the page.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Camera not supported in this browser.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage += 'Camera constraints too restrictive.';
        } else {
          errorMessage += error.message;
        }
      }
      
      setCameraError(errorMessage);
      console.log('Setting camera error:', errorMessage);
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
      // Reset capture state when turning off camera
      setCaptureState('initial');
      setCapturedImageUrl('');
    } else {
      startCamera();
      setIsPowerOn(true);
    }
  };

  const handleCaptureClick = async () => {
    if (captureState === 'initial' && !isCapturing) {
      console.log('Starting photo capture...');
      setIsCapturing(true);

      try {
        // Wait a bit to ensure video is stable
        await new Promise(resolve => setTimeout(resolve, 100));

        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');

          // Check video readiness
          if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            console.log('Video not ready, waiting...');
            await new Promise(resolve => {
              const checkReady = () => {
                if (video.readyState >= video.HAVE_ENOUGH_DATA) {
                  resolve(undefined);
                } else {
                  setTimeout(checkReady, 50);
                }
              };
              checkReady();
            });
          }

          if (context && video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('Capturing image from video:', video.videoWidth, 'x', video.videoHeight);

            // Set canvas dimensions to video dimensions
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Clear any previous transforms
            context.setTransform(1, 0, 0, 1, 0, 0);

            // For front camera, flip the captured image to match what user expects
            // For rear camera, capture normally (no flipping needed)
            if (isUsingFrontCamera) {
              context.scale(-1, 1);
              context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            } else {
              // Draw current video frame to canvas normally for rear camera
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
            }

            // Convert to data URL (base64 image)
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);

            console.log('Photo captured successfully, data URL length:', imageDataUrl.length);
            console.log('Setting captured image URL...');

            // Set the captured image URL
            setCapturedImageUrl(imageDataUrl);

            // Wait a moment to ensure the image URL is set
            await new Promise(resolve => setTimeout(resolve, 100));

            console.log('Changing capture state to confirm...');
            // Change to confirm state to show the captured image and confirm buttons
            setCaptureState('confirm');

            console.log('Capture state changed to confirm, capturedImageUrl length:', imageDataUrl.length);
          } else {
            throw new Error('Canvas context or video dimensions not available');
          }
        } else {
          throw new Error('Video or canvas not available');
        }
      } catch (error) {
        console.error('Error capturing photo:', error);
        alert('Failed to capture photo. Please try again.');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handleCancelCapture = () => {
    console.log('Canceling capture - returning to live camera view');
    setCaptureState('initial');
    setCapturedImageUrl('');
    // Note: We don't stop the camera, just return to live view
    // Ensure video is playing if it stopped
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(error => {
        console.error('Error resuming video after cancel:', error);
      });
    }
  };

  const handleConfirmCapture = () => {
    console.log('Confirming capture, capturedImageUrl length:', capturedImageUrl.length);
    if (capturedImageUrl) {
      // Add current photo to the array
      const updatedImages = [...capturedImages, capturedImageUrl];
      setCapturedImages(updatedImages);
      
      console.log(`Photo ${updatedImages.length} of ${MAX_PHOTOS} captured`);
      
      // If we've reached max photos, go directly to details
      if (updatedImages.length >= MAX_PHOTOS) {
        sessionStorage.setItem('capturedImages', JSON.stringify(updatedImages));
        console.log('Max photos reached, navigating to details-live');
        navigate('/details-live');
      } else {
        // Show "Continue stakeout?" prompt
        setCaptureState('continue-prompt');
      }
    } else {
      console.error('No captured image available for confirmation');
      alert('No image captured. Please try again.');
    }
  };
  
  const handleContinueStakeout = () => {
    console.log('Continuing stakeout for another photo');
    setCaptureState('initial');
    setCapturedImageUrl('');
    // Ensure video is playing
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(error => {
        console.error('Error resuming video:', error);
      });
    }
  };
  
  const handleFinishStakeout = () => {
    console.log('Finishing stakeout, saving photos and navigating');
    sessionStorage.setItem('capturedImages', JSON.stringify(capturedImages));
    navigate('/details-live');
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm flex-shrink-0 z-10 pt-safe">
        <div className="flex justify-between items-center h-16 xs:h-20 px-4">
          <div></div>
          <h1 className="text-lg xs:text-xl font-semibold text-white">Capture</h1>
          <button
            className="p-2 hover:bg-white/10 rounded-full transition-colors touch-target"
            onClick={() => navigate('/')}
          >
            <Home className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center bg-gray-900 overflow-hidden">
        {/* Camera Off State */}
        {!isPowerOn && (
          <div className="text-center px-4">
            <Camera className="w-20 h-20 xs:w-24 xs:h-24 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mt-2 text-sm xs:text-base">Camera is off</p>
            {cameraError && (
              <p className="text-red-400 mt-2 text-xs xs:text-sm px-4 max-w-sm mx-auto">{cameraError}</p>
            )}
          </div>
        )}

        {/* Camera On State */}
        {isPowerOn && (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center relative overflow-hidden">
            {captureState === 'initial' ? (
              // Show live video feed - NO mirroring for rear camera, mirror only for front camera
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${isUsingFrontCamera ? 'scale-x-[-1]' : ''
                  }`}
              />
            ) : captureState === 'confirm' && capturedImageUrl ? (
              // Show captured image for review - this should display after capture button is pressed
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={capturedImageUrl}
                  alt="Captured photo for review"
                  className="w-full h-full object-cover"
                  onLoad={() => console.log('Captured image loaded for review')}
                  onError={(e) => {
                    console.error('Error loading captured image:', e);
                    // Fallback to initial state if image fails to load
                    setCaptureState('initial');
                    setCapturedImageUrl('');
                  }}
                />
                {/* Overlay to indicate this is review mode */}
                <div className="absolute top-4 left-4 bg-black/70 rounded-lg px-3 py-1">
                  <p className="text-white text-xs xs:text-sm">Review Photo</p>
                </div>
              </div>
            ) : captureState === 'continue-prompt' ? (
              // Show "Continue stakeout?" prompt centered on screen with live video in background
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${isUsingFrontCamera ? 'scale-x-[-1]' : ''
                    }`}
                />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <div className="bg-black/90 rounded-2xl p-6 xs:p-8 mx-4 max-w-md w-full shadow-2xl border border-white/10">
                    <div className="text-center space-y-4">
                      <p className="text-white text-sm xs:text-base mb-1">Photo {capturedImages.length} of {MAX_PHOTOS} saved</p>
                      <p className="text-vice-cyan text-xl xs:text-2xl font-bold">Continue stakeout?</p>
                      <div className="flex gap-4 justify-center pt-4">
                        <button
                          className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow-lg transform active:scale-95 transition-all min-h-[48px] flex-1"
                          onClick={handleFinishStakeout}
                        >
                          No - Book Em
                        </button>
                        <button
                          className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold shadow-lg transform active:scale-95 transition-all min-h-[48px] flex-1"
                          onClick={handleContinueStakeout}
                        >
                          Yes - Continue
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Fallback state - show loading or return to initial
              <div className="text-center text-white px-4">
                <p className="text-sm xs:text-base">Loading captured image...</p>
              </div>
            )}

            {/* Capturing indicator */}
            {isCapturing && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                <div className="bg-black/70 rounded-lg px-4 py-2">
                  <p className="text-white text-xs xs:text-sm">Capturing...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden Canvas for Photo Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </main>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-sm flex-shrink-0 pb-safe">
        {/* Capture Confirm State - Red X (Cancel) and Green Check (Approve) buttons */}
        {captureState === 'confirm' && (
          <div className="flex justify-center py-4">
            <div className="flex gap-12 xs:gap-16">
              <button
                className="touch-target-lg bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-all"
                onClick={handleCancelCapture}
                title="Cancel - Take Another Photo"
              >
                <X className="w-6 h-6 xs:w-8 xs:h-8 text-white" />
              </button>
              <button
                className="touch-target-lg bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-all"
                onClick={handleConfirmCapture}
                title="Approve - Save Photo"
              >
                <Check className="w-6 h-6 xs:w-8 xs:h-8 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Main Controls - Only show when in initial state (live camera view) */}
        {captureState === 'initial' && (
          <div className="flex justify-between items-center h-24 xs:h-28 px-4">
            {/* Power Button */}
            <button
              className="touch-target rounded-full hover:bg-white/10 transition-colors"
              onClick={handlePowerClick}
            >
              <Power
                className={`w-6 h-6 xs:w-8 xs:h-8 ${isPowerOn ? 'text-green-500' : 'text-red-500'
                  }`}
              />
            </button>

            {/* Capture Button - Only show in initial state */}
            <div className="flex-grow flex justify-center">
              <button
                className={`w-16 h-16 xs:w-20 xs:h-20 bg-white rounded-full flex items-center justify-center shadow-lg transform transition-all touch-target-lg ${!isPowerOn || isCapturing
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95'
                  }`}
                onClick={handleCaptureClick}
                disabled={!isPowerOn || isCapturing}
              >
                <div className="w-12 h-12 xs:w-16 xs:h-16 bg-white rounded-full border-2 xs:border-4 border-black"></div>
              </button>
            </div>

            {/* Settings Button */}
            <button className="touch-target rounded-full hover:bg-white/10 transition-colors">
              <Settings className="w-6 h-6 xs:w-8 xs:h-8 text-white" />
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};

export default CameraCapture;