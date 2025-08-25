import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Printer, 
  Mail, 
  Image as ImageIcon,
  Calendar,
  MapPin,
  Clock
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
  
  // Sample violation records - would come from Supabase in real implementation
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
      status: 'draft'
    }
  ]);

  const handleSelectRecord = (id: string) => {
    setSelectedRecords(prev => 
      prev.includes(id) 
        ? prev.filter(recordId => recordId !== id)
        : [...prev, id]
    );
  };

  const handleExportPDF = () => {
    console.log('Exporting to PDF:', selectedRecords);
    // Implementation would create PDF using libraries like jsPDF or react-pdf
  };

  const handleExportWord = () => {
    console.log('Exporting to Word:', selectedRecords);
    // Implementation would create Word doc using libraries like docx
  };

  const handlePrint = () => {
    console.log('Printing:', selectedRecords);
    // Implementation would format and print selected violations
  };

  const handleEmail = () => {
    console.log('Emailing:', selectedRecords);
    // Implementation would prepare email with violations
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
            {selectedRecords.length} violation{selectedRecords.length !== 1 ? 's' : ''} selected
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          onClick={handleExportPDF}
          disabled={selectedRecords.length === 0}
          className="bg-gradient-primary flex flex-col gap-1 h-auto py-4"
        >
          <FileText className="w-5 h-5" />
          <span className="text-xs">Export PDF</span>
        </Button>
        
        <Button
          onClick={handleExportWord}
          disabled={selectedRecords.length === 0}
          variant="outline"
          className="flex flex-col gap-1 h-auto py-4"
        >
          <Download className="w-5 h-5" />
          <span className="text-xs">Word Doc</span>
        </Button>
        
        <Button
          onClick={handlePrint}
          disabled={selectedRecords.length === 0}
          variant="outline"
          className="flex flex-col gap-1 h-auto py-4"
        >
          <Printer className="w-5 h-5" />
          <span className="text-xs">Print</span>
        </Button>
        
        <Button
          onClick={handleEmail}
          disabled={selectedRecords.length === 0}
          variant="outline"
          className="flex flex-col gap-1 h-auto py-4"
        >
          <Mail className="w-5 h-5" />
          <span className="text-xs">Email</span>
        </Button>
      </div>

      {/* Violation Records */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Violation Records</h3>
        
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
          <h3 className="text-lg font-medium text-foreground mb-4">Export Preview</h3>
          
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">
              Ready to export {selectedRecords.length} violation record{selectedRecords.length !== 1 ? 's' : ''}:
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