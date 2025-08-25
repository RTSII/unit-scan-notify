import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Plus, Trash2 } from "lucide-react";

interface ViolationField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'time';
  required: boolean;
  placeholder?: string;
}

const ViolationTemplate = () => {
  const [noticeName, setNoticeName] = useState("");
  const [fields, setFields] = useState<ViolationField[]>([
    { id: '1', label: 'Unit Number', type: 'text', required: true, placeholder: 'e.g., B2G' },
    { id: '2', label: 'Date of Violation', type: 'date', required: true },
    { id: '3', label: 'Time of Violation', type: 'time', required: true },
    { id: '4', label: 'Violation Description', type: 'textarea', required: true, placeholder: 'Describe the violation...' },
    { id: '5', label: 'Location Details', type: 'text', required: false, placeholder: 'Parking spot, building area, etc.' },
  ]);

  // Auto-populate notice name with Unit Number_MMDD format
  useEffect(() => {
    const unitNumberField = fields.find(field => field.label === 'Unit Number');
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    
    if (unitNumberField) {
      setNoticeName(`${unitNumberField.label}_${month}${day}`);
    }
  }, [fields]);

  const addField = () => {
    const newField: ViolationField = {
      id: Date.now().toString(),
      label: 'New Field',
      type: 'text',
      required: false,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const updateField = (id: string, updates: Partial<ViolationField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

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
          {fields.map((field, index) => (
            <Card key={field.id} className="border border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Field {index + 1}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeField(field.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Field Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Field name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Field Type</Label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, { type: e.target.value as ViolationField['type'] })}
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="text">Text Input</option>
                      <option value="textarea">Text Area</option>
                      <option value="date">Date</option>
                      <option value="time">Time</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Placeholder Text</Label>
                  <Input
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                    placeholder="Enter placeholder text..."
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`required-${field.id}`}
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                  />
                  <Label htmlFor={`required-${field.id}`} className="text-sm">
                    Required field
                  </Label>
                </div>
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

export default ViolationTemplate;