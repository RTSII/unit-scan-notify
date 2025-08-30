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
  value: string;
}

interface ViolationTemplateProps {
  blankMode?: boolean;
}

const ViolationTemplate = ({ blankMode = false }: ViolationTemplateProps) => {
  const [noticeName, setNoticeName] = useState("");
  const [fields, setFields] = useState<ViolationField[]>([
    { id: '1', label: 'Unit Number', type: 'text', required: true, placeholder: 'e.g., B2G', value: '' },
    { id: '2', label: 'Date', type: 'text', required: true, placeholder: '__/__', value: '' },
    { id: '3', label: 'Time', type: 'text', required: true, placeholder: '__:__', value: '' },
    { id: '4', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the violation...', value: '' },
    { id: '5', label: 'Location', type: 'text', required: false, placeholder: 'Parking spot, building area, etc.', value: '' },
  ]);

  // Auto-populate notice name with Unit Number_MMDD format (only if not in blank mode)
  useEffect(() => {
    if (!blankMode) {
      const unitNumberField = fields.find(field => field.label === 'Unit Number');
      const currentDate = new Date();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      
      if (unitNumberField) {
        setNoticeName(`${unitNumberField.label}_${month}${day}`);
      }
    }
  }, [fields, blankMode]);

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

export default ViolationTemplate;