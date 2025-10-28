import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';

interface TutorialStep {
  title: string;
  description: string;
  image?: string;
  videoUrl?: string;
}

interface TutorialSlideshowProps {
  isOpen: boolean;
  onClose: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "411 on SPR Vice City",
    description: "",
    image: "/vicecity.png"
  },
  {
    title: "Dashboard Navigation",
    description: "Tap the central Siri Orb to reveal the navigation menu. This gives you quick access to all main features arranged in a semicircle above the orb.",
    image: "/2.png"
  },
  {
    title: "Books - View Violations",
    description: "Access the Books section to view all recorded violations. Browse through violations with our interactive 3D carousel, filter by date ranges, and view detailed information for each entry.",
    image: "/Books.png"
  },
  {
    title: "Capture - New Violations",
    description: "Use the Capture feature to document new violations in the field. Take photos directly from your device camera, add location details, and categorize the violation type. All data is instantly saved to the cloud.",
    image: "/nv.png"
  },
  {
    title: "Details - Add Previous Violations",
    description: "Use the Details section to add violations that occurred previously. Upload photos you took earlier, add the date when the violation occurred, and enter location and violation details. Perfect for catching up on documentation.",
    image: "/image.png"
  },
  {
    title: "Export - Generate Reports",
    description: "Export your data in multiple formats (PDF, Excel, CSV). Generate custom reports for board meetings, audits, or record-keeping. Filter by date range and violation type.",
    image: "/Export.png"
  },
  {
    title: "User Profile & Active Users",
    description: "Click your avatar in the top-right to access your profile. Expand the dropdown to see other active users in real-time. Sign out securely when you're done.",
    image: "/2.png"
  }
];

export default function TutorialSlideshow({ isOpen, onClose }: TutorialSlideshowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setCurrentStep(tutorialSteps.length - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setAutoPlay(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full h-[90vh] p-0 bg-gradient-to-br from-black via-vice-purple/20 to-black border-2 border-vice-cyan/30 overflow-y-auto safe-top safe-bottom">
        <div className="relative h-full flex flex-col">
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 flex gap-2">
            <Button
              onClick={() => setAutoPlay(!autoPlay)}
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-vice-cyan/20 backdrop-blur-sm border border-vice-pink/30 hover:bg-vice-cyan/30 touch-lg"
            >
              {autoPlay ? (
                <Pause className="h-5 w-5 text-vice-cyan" />
              ) : (
                <Play className="h-5 w-5 text-vice-cyan" />
              )}
            </Button>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-vice-pink/20 backdrop-blur-sm border border-vice-cyan/30 hover:bg-vice-pink/30 touch-lg"
            >
              <X className="h-5 w-5 text-vice-pink" />
            </Button>
          </div>

          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="min-h-full flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 py-16 sm:py-20"
              >
                <div className="text-center mb-3 sm:mb-4">
                  <div className="inline-block px-3 py-1 bg-vice-cyan/20 rounded-full border border-vice-cyan/30 mb-2 sm:mb-3">
                    <span className="text-vice-cyan text-sm font-medium">
                      Step {currentStep + 1} of {tutorialSteps.length}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 text-shadow-lg">
                    {tutorialSteps[currentStep].title}
                  </h2>
                  {tutorialSteps[currentStep].description && (
                    <p className="text-xs sm:text-sm md:text-base text-gray-300 max-w-xl mx-auto leading-snug px-2">
                      {tutorialSteps[currentStep].description}
                    </p>
                  )}
                </div>

                {tutorialSteps[currentStep].image && (
                  <div className="relative w-full max-w-[320px] sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto mt-3 sm:mt-4">
                    <div className="aspect-video rounded-lg overflow-hidden border-2 border-vice-cyan/30 shadow-2xl bg-black">
                      <img
                        src={tutorialSteps[currentStep].image}
                        alt={tutorialSteps[currentStep].title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-3 sm:py-4 bg-black/50 backdrop-blur-sm border-t border-vice-cyan/30 shrink-0">
            <Button
              onClick={prevStep}
              variant="ghost"
              className="flex items-center gap-1 sm:gap-2 text-vice-cyan hover:text-vice-pink hover:bg-vice-cyan/10 transition-colors text-sm sm:text-base touch-lg px-2 sm:px-4"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              Previous
            </Button>

            <div className="flex gap-2">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-vice-pink'
                      : 'w-2 bg-vice-cyan/30 hover:bg-vice-cyan/50'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextStep}
              variant="ghost"
              className="flex items-center gap-1 sm:gap-2 text-vice-cyan hover:text-vice-pink hover:bg-vice-cyan/10 transition-colors text-sm sm:text-base touch-lg px-2 sm:px-4"
            >
              Next
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
