import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, Home, Camera, Download, FileText, ChevronDown, ChevronUp } from "lucide-react";

const DetailsPrevious = () => {
  const { user, loading } = useAuth();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isPhotosExpanded, setIsPhotosExpanded] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    unit: '',
    description: '',
    violationTypes: {
      itemsOutside: false,
      trashOutside: false,
      itemsBalcony: false,
    }
  });

  // Keep fields blank for details-previous (no auto-completion)
  useEffect(() => {
    setFormData({
      date: '',
      time: '',
      unit: '',
      description: '',
      violationTypes: {
        itemsOutside: false,
        trashOutside: false,
        itemsBalcony: false,
      }
    });
  }, []);

  const handleViolationTypeChange = (type: keyof typeof formData.violationTypes, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      violationTypes: {
        ...prev.violationTypes,
        [type]: checked
      }
    }));
  };

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-vice-cyan/20">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-white/10"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
        <h1 className="text-xl font-bold">Details</h1>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-white/10"
          onClick={() => window.location.href = '/'}
        >
          <Home className="w-4 h-4" />
        </Button>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-6 pb-24 max-w-md mx-auto">
        {/* Date, Time, Unit Fields */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="space-y-2">
            <Label className="text-vice-cyan font-medium text-sm">Date</Label>
            <Input
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              placeholder=""
              className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-sm h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-vice-cyan font-medium text-sm">Time</Label>
            <Input
              value={formData.time}
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              placeholder=""
              className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-sm h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-vice-cyan font-medium text-sm">Unit</Label>
            <Input
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              placeholder=""
              className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-sm h-10"
            />
          </div>
        </div>

        {/* Violation Type Section */}
        <div className="space-y-4">
          <h3 className="text-vice-cyan font-medium">Violation Type (Select applicable)</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
              <Checkbox
                checked={formData.violationTypes.itemsOutside}
                onCheckedChange={(checked) => handleViolationTypeChange('itemsOutside', checked as boolean)}
                className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
              />
              <Label className="text-white cursor-pointer text-sm">Items left outside Unit</Label>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
              <Checkbox
                checked={formData.violationTypes.trashOutside}
                onCheckedChange={(checked) => handleViolationTypeChange('trashOutside', checked as boolean)}
                className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
              />
              <Label className="text-white cursor-pointer text-sm">Trash left outside Unit</Label>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
              <Checkbox
                checked={formData.violationTypes.itemsBalcony}
                onCheckedChange={(checked) => handleViolationTypeChange('itemsBalcony', checked as boolean)}
                className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
              />
              <Label className="text-white cursor-pointer text-sm">Items left on balcony/front railing</Label>
            </div>
          </div>
        </div>

        {/* Description Section - Collapsible */}
        <div className="space-y-3">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-vice-pink"></div>
              <Label className="text-vice-pink font-medium">Description</Label>
            </div>
            {isDescriptionExpanded ? (
              <ChevronUp className="w-4 h-4 text-vice-pink" />
            ) : (
              <ChevronDown className="w-4 h-4 text-vice-pink" />
            )}
          </div>
          {isDescriptionExpanded && (
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder=""
              className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 min-h-[100px] resize-none"
            />
          )}
        </div>

        {/* Photo Evidence Section - Collapsible */}
        <div className="space-y-3">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsPhotosExpanded(!isPhotosExpanded)}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-vice-pink"></div>
              <Label className="text-vice-pink font-medium">Photo Evidence</Label>
            </div>
            {isPhotosExpanded ? (
              <ChevronUp className="w-4 h-4 text-vice-pink" />
            ) : (
              <ChevronDown className="w-4 h-4 text-vice-pink" />
            )}
          </div>
          {isPhotosExpanded && (
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square bg-black/40 border border-vice-cyan/30 rounded-lg flex items-center justify-center">
                <Camera className="w-8 h-8 text-white/40" />
              </div>
              <div className="aspect-square bg-black/40 border border-vice-cyan/30 rounded-lg flex items-center justify-center">
                <Camera className="w-8 h-8 text-white/40" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-vice-cyan/20 p-4 z-50">
        <div className="flex justify-around max-w-md mx-auto">
          <Button variant="ghost" className="flex flex-col items-center space-y-1 text-vice-cyan">
            <Camera className="w-6 h-6" />
            <span className="text-xs">Capture</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 text-vice-pink">
            <FileText className="w-6 h-6" />
            <span className="text-xs">Details</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 text-vice-cyan">
            <Download className="w-6 h-6" />
            <span className="text-xs">Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DetailsPrevious;