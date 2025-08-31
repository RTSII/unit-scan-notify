import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Plus, Trash2, ArrowLeft, Home, Camera, Download, FileText } from "lucide-react";

interface ViolationField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'time';
  required: boolean;
  placeholder?: string;
  value: string;
}

interface DetailsPreviousProps {
  blankMode?: boolean;
}

const DetailsPrevious = ({ blankMode = false }: DetailsPreviousProps) => {
  const [noticeName, setNoticeName] = useState("");
  const [fields, setFields] = useState<ViolationField[]>([
    { id: '1', label: 'Unit Number', type: 'text', required: true, placeholder: 'e.g., B2G', value: '' },
    { id: '2', label: 'Date', type: 'text', required: true, placeholder: '__/__', value: '' },
    { id: '3', label: 'Time', type: 'text', required: true, placeholder: '__:__', value: '' },
    { id: '4', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the violation...', value: '' },
    { id: '5', label: 'Location', type: 'text', required: false, placeholder: 'Parking spot, building area, etc.', value: '' },
  ]);

  // Blank mode form state
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

  // Check if we're in Details-live mode (from capture flow) or dashboard Details mode
  const isDetailsLive = window.location.pathname.includes('details-live') || window.location.search.includes('live=true');
  
  // Keep all fields blank for template mode
  useEffect(() => {
    if (blankMode) {
      // For template mode - keep all fields blank
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
    }
  }, [blankMode]);

  const addField = () => {
    const newField: ViolationField = {
      id: Date.now().toString(),
      label: 'New Field',
      type: 'text',
      required: false,
      value: '',
    };
    setFields([...fields, newField]);
  };

  const clearField = (id: string) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, value: '' } : field
    ));
  };

  const updateField = (id: string, updates: Partial<ViolationField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const handleViolationTypeChange = (type: keyof typeof formData.violationTypes, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      violationTypes: {
        ...prev.violationTypes,
        [type]: checked
      }
    }));
  };

  // Render blank violation form
  if (blankMode) {
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
          <h1 className="text-xl font-bold">{isDetailsLive ? 'Details-live' : 'Details'}</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            onClick={() => window.location.href = '/dashboard'}
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>

        {/* Form Content */}
        <div className="p-4 space-y-6">
          {/* Date, Time, Unit Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-vice-cyan font-medium">Date</Label>
              <Input
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                placeholder="08/30"
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-vice-cyan font-medium">Time</Label>
              <Input
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                placeholder="08:18 PM"
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-vice-cyan font-medium">Unit</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder=""
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60"
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
                <Label className="text-white cursor-pointer">Items left outside Unit</Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
                <Checkbox
                  checked={formData.violationTypes.trashOutside}
                  onCheckedChange={(checked) => handleViolationTypeChange('trashOutside', checked as boolean)}
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                />
                <Label className="text-white cursor-pointer">Trash left outside Unit</Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
                <Checkbox
                  checked={formData.violationTypes.itemsBalcony}
                  onCheckedChange={(checked) => handleViolationTypeChange('itemsBalcony', checked as boolean)}
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                />
                <Label className="text-white cursor-pointer">Items left on balcony/front railing</Label>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-vice-pink"></div>
              <Label className="text-vice-pink font-medium">Description</Label>
            </div>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder=""
              className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 min-h-[100px]"
            />
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-vice-cyan/20 p-4">
          <div className="flex justify-around">
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
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      {/* Fields Configuration */}
      <div className="form-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Form Fields</h3>
          <Button variant="outline" onClick={addField} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field) => (
            <Card key={field.id} className="border border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{field.label}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearField(field.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={field.value}
                    onChange={(e) => updateField(field.id, { value: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full"
                  />
                ) : (
                  <Input
                    value={field.value}
                    onChange={(e) => updateField(field.id, { value: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <div className="form-section">
        <h3 className="text-lg font-medium text-foreground mb-4">Notice Preview</h3>
        
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
          <h4 className="font-medium text-foreground">{noticeName}</h4>
          
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              
              {field.type === 'textarea' ? (
                <Textarea
                  placeholder={field.placeholder}
                  disabled
                  className="bg-background"
                />
              ) : (
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  disabled
                  className="bg-background"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notice Name Section - Moved to Bottom */}
      <div className="form-section">
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-foreground">Notice Name</CardTitle>
              <Button className="bg-gradient-primary">
                <Save className="w-4 h-4 mr-2" />
                Save Notice
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div>
              <Label htmlFor="noticeName" className="text-sm font-medium">
                Notice Name
              </Label>
              <Input
                id="noticeName"
                value={noticeName}
                onChange={(e) => setNoticeName(e.target.value)}
                className="mt-1"
                placeholder="Tap to edit notice name"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DetailsPrevious;