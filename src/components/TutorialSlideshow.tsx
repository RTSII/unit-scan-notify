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
    title: "Welcome to SPR Vice City",
    description: "Your complete mobile solution for HOA violation tracking and management. This tutorial will guide you through the main features of the app.",
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
    description: "Use the Capture feature to document new violations. Take photos directly from your device camera, add location details, and categorize the violation type. All data is instantly saved to the cloud.",
    image: "/nv.png"
  },
  {
    title: "Details - Review History",
    description: "The Details section provides comprehensive violation history. View all submitted violations with timestamps, photos, and location data. Track resolution status and add follow-up notes.",
    image: "/image.png"
  },
  {
    title: "Export - Generate Reports",
    description: "Export your data in multiple formats (PDF, Excel, CSV). Generate custom reports for board meetings, audits, or record-keeping. Filter by date range and violation type.",
    image: "/Export.png"
  },
  {
    title: "Admin Panel (Admin Users)",
    description: "Admin users have access to additional features including user management, invite system, activity tracking, and violation statistics. Manage the entire system from one centralized location.",
    image: "/Admin.png"
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
      <DialogContent className="max-w-4xl h-[90vh] p-0 bg-gradient-to-br from-black via-vice-purple/20 to-black border-2 border-vice-cyan/30 overflow-hidden">
        <div className="relative h-full flex flex-col">
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <Button
              onClick={() => setAutoPlay(!autoPlay)}
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-vice-cyan/20 backdrop-blur-sm border border-vice-pink/30 hover:bg-vice-cyan/30"
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
              className="h-10 w-10 rounded-full bg-vice-pink/20 backdrop-blur-sm border border-vice-cyan/30 hover:bg-vice-pink/30"
            >
              <X className="h-5 w-5 text-vice-pink" />
            </Button>
          </div>

          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col items-center justify-center p-8"
              >
                <div className="text-center mb-6">
                  <div className="inline-block px-4 py-1 bg-vice-cyan/20 rounded-full border border-vice-cyan/30 mb-4">
                    <span className="text-vice-cyan text-sm font-medium">
                      Step {currentStep + 1} of {tutorialSteps.length}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4 text-shadow-lg">
                    {tutorialSteps[currentStep].title}
                  </h2>
                  <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                    {tutorialSteps[currentStep].description}
                  </p>
                </div>

                {tutorialSteps[currentStep].image && (
                  <div className="relative w-full max-w-3xl aspect-video rounded-lg overflow-hidden border-2 border-vice-cyan/30 shadow-2xl">
                    <img
                      src={tutorialSteps[currentStep].image}
                      alt={tutorialSteps[currentStep].title}
                      className="w-full h-full object-contain bg-black/50"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between px-8 py-6 bg-black/50 backdrop-blur-sm border-t border-vice-cyan/30">
            <Button
              onClick={prevStep}
              variant="ghost"
              className="flex items-center gap-2 text-vice-cyan hover:text-vice-pink hover:bg-vice-cyan/10 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
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
              className="flex items-center gap-2 text-vice-cyan hover:text-vice-pink hover:bg-vice-cyan/10 transition-colors"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
