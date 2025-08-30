import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  Printer, 
  Image as ImageIcon,
  Calendar,
  MapPin,
  Clock,
  Save
} from "lucide-react";

interface ViolationRecord {
  id: string;
  unitNumber: string;
  date: string;
  time: string;
  location: string;
  description: string;
  photoCount: number;
  status: 'draft' | 'completed' | 'exported';
}

const ExportCenter = () => {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Sample violation records - would come from Details tab in real implementation
  const [violations] = useState<ViolationRecord[]>([
    {
      id: '1',
      unitNumber: 'B2G',
      date: '2024-01-20',
      time: '14:30',
      location: 'Parking Lot A',
      description: 'Vehicle parked in fire lane',
      photoCount: 3,
      status: 'completed'
    },
    {
      id: '2',
      unitNumber: 'C14',
      date: '2024-01-20',
      time: '16:15',
      location: 'Building C Entrance',
      description: 'Improper waste disposal',
      photoCount: 2,
      status: 'completed'
    }
  ]);

  const handleSelectRecord = (id: string) => {
    setSelectedRecords(prev => 
      prev.includes(id) 
        ? prev.filter(recordId => recordId !== id)
        : [...prev, id]
    );
  };

  const handleSaveToBooks = async () => {
    if (!user || selectedRecords.length === 0) return;
    
    setSaving(true);
    try {
      const formsToSave = violations.filter(v => selectedRecords.includes(v.id));
      
      for (const form of formsToSave) {
        const { error } = await supabase
          .from('violation_forms')
          .insert({
            user_id: user.id,
            unit_number: form.unitNumber,
            date: form.date,
            time: form.time,
            location: form.location,
            description: form.description,
            photos: [], // Would include actual photo URLs
            status: 'saved'
          });
        
        if (error) throw error;
      }
      
      toast({
        title: "Success!",
        description: `${formsToSave.length} form${formsToSave.length !== 1 ? 's' : ''} saved to Books`,
      });
      
      setSelectedRecords([]);
    } catch (error) {
      console.error('Error saving forms:', error);
      toast({
        title: "Error",
        description: "Failed to save forms to Books",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (selectedRecords.length === 0) return;
    
    console.log('Printing:', selectedRecords);
    window.print();
    
    toast({
      title: "Print Ready",
      description: `${selectedRecords.length} form${selectedRecords.length !== 1 ? 's' : ''} sent to printer`,
    });
  };

  const getStatusBadge = (status: ViolationRecord['status']) => {
    const variants = {
      draft: 'bg-warning/10 text-warning border-warning/20',
      completed: 'bg-success/10 text-success border-success/20',
      exported: 'bg-muted/10 text-muted-foreground border-muted/20'
    };
    
    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="form-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Export Center</h2>
          <div className="text-sm text-muted-foreground">
            {selectedRecords.length} form{selectedRecords.length !== 1 ? 's' : ''} selected
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={handleSaveToBooks}
          disabled={selectedRecords.length === 0 || saving}
          className="bg-gradient-primary flex items-center gap-3 h-auto py-6 text-lg"
        >
          <BookOpen className="w-6 h-6" />
          <div className="flex flex-col items-start">
            <span>{saving ? 'Saving...' : 'Save to Books'}</span>
            <span className="text-sm opacity-80">Required to save form</span>
          </div>
        </Button>
        
        <Button
          onClick={handlePrint}
          disabled={selectedRecords.length === 0}
          variant="outline"
          className="flex items-center gap-3 h-auto py-6 text-lg border-primary/50 hover:bg-primary/10"
        >
          <Printer className="w-6 h-6" />
          <div className="flex flex-col items-start">
            <span>Print Form</span>
            <span className="text-sm opacity-70">Optional</span>
          </div>
        </Button>
      </div>

      {/* Instructions */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <div className="flex items-start gap-3">
          <Save className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Export Instructions</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select completed forms below and click "Save to Books" to store them in your database. 
              You can optionally print them as well. Forms must be saved to Books to appear in your directory.
            </p>
          </div>
        </div>
      </div>

      {/* Violation Records */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Completed Forms</h3>
        
        {violations.map((violation) => (
          <Card 
            key={violation.id} 
            className={`cursor-pointer transition-all duration-200 border ${
              selectedRecords.includes(violation.id) 
                ? 'border-primary bg-primary/5 shadow-md' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleSelectRecord(violation.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4">
                    <input
                      type="checkbox"
                      checked={selectedRecords.includes(violation.id)}
                      onChange={() => handleSelectRecord(violation.id)}
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Unit {violation.unitNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {violation.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(violation.status)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{violation.date}</span>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{violation.time}</span>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{violation.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span>{violation.photoCount} photo{violation.photoCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Preview */}
      {selectedRecords.length > 0 && (
        <div className="form-section">
          <h3 className="text-lg font-medium text-foreground mb-4">Selected Forms</h3>
          
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">
              Ready to process {selectedRecords.length} form{selectedRecords.length !== 1 ? 's' : ''}:
            </p>
            
            <div className="space-y-2">
              {selectedRecords.map(id => {
                const violation = violations.find(v => v.id === id);
                return violation ? (
                  <div key={id} className="flex items-center justify-between text-sm bg-background rounded p-2 border border-border">
                    <span>Unit {violation.unitNumber} - {violation.description}</span>
                    <span className="text-muted-foreground">{violation.date}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportCenter;