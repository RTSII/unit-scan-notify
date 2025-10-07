import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import { useToast } from '../hooks/use-toast';
import { 
  Home, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Mail, 
  Printer,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ViolationForm {
  id: string;
  unit_number: string;
  date?: string; // Legacy field
  time?: string; // Legacy field
  occurred_at?: string; // New timestamp field
  location: string;
  description: string;
  status: string;
  created_at: string;
  photos?: string[]; // Photos array from violation_photos join
  violation_photos?: Array<{
    id: string;
    storage_path: string;
    created_at: string;
  }>;
}

export default function Export() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [forms, setForms] = useState<ViolationForm[]>([]);
  const [filteredForms, setFilteredForms] = useState<ViolationForm[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [isThisWeekExpanded, setIsThisWeekExpanded] = useState(false);
  const [thisWeekCount, setThisWeekCount] = useState(0);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchForms();
    }
  }, [user]);

  useEffect(() => {
    filterForms();
  }, [forms, searchTerm, filterStatus]);

  useEffect(() => {
    calculateThisWeekCount();
  }, [forms]);

  const fetchForms = async () => {
    try {
      // @ts-ignore - Supabase types need regeneration for violation_forms_new
      const { data, error } = await supabase
        .from('violation_forms')
        .select(`
          *,
          violation_photos (
            id,
            storage_path,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map photos array from violation_photos join
      const formsWithPhotos = (data || []).map(form => ({
        ...form,
        // @ts-ignore - Supabase types need regeneration
        photos: form.violation_photos?.map(p => p.storage_path) || []
      }));
      
      // @ts-ignore - Type assertion needed
      setForms(formsWithPhotos);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: "Failed to load violation forms",
        variant: "destructive",
      });
    }
  };

  const filterForms = () => {
    let filtered = forms;

    if (searchTerm) {
      filtered = filtered.filter(form =>
        form.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(form => form.status === filterStatus);
    }

    setFilteredForms(filtered);
  };

  const calculateThisWeekCount = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekForms = forms.filter(form => {
      const formDate = new Date(form.created_at);
      return formDate >= startOfWeek;
    });

    setThisWeekCount(thisWeekForms.length);
  };

  const handleFormSelection = (formId: string, checked: boolean) => {
    if (checked) {
      setSelectedForms(prev => [...prev, formId]);
    } else {
      setSelectedForms(prev => prev.filter(id => id !== formId));
    }
  };

  const removeSelectedForm = (formId: string) => {
    setSelectedForms(prev => prev.filter(id => id !== formId));
  };

  const handleEmailExport = () => {
    if (selectedForms.length === 0) {
      toast({
        title: "No notices selected",
        description: "Please select at least one notice to export",
        variant: "destructive",
      });
      return;
    }

    const selectedNotices = forms.filter(form => selectedForms.includes(form.id));
    const emailBody = selectedNotices.map(form => {
      // Format date from occurred_at or use legacy date/time
      let dateStr = '';
      if (form.occurred_at) {
        const dateObj = new Date(form.occurred_at);
        dateStr = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${dateObj.getFullYear()}`;
      } else if (form.date) {
        dateStr = form.date;
      }
      
      let timeStr = '';
      if (form.occurred_at) {
        const dateObj = new Date(form.occurred_at);
        timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      } else if (form.time) {
        timeStr = form.time;
      }
      
      return `Unit: ${form.unit_number}\nDate: ${dateStr}\nTime: ${timeStr}\nLocation: ${form.location}\nDescription: ${form.description}\nPhotos: ${form.photos?.length || 0}\n\n`;
    }).join('---\n\n');

    const subject = `SPR Violation Notices - ${selectedNotices.length} notice(s)`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    window.location.href = mailtoLink;
  };

  const handlePrintExport = () => {
    if (selectedForms.length === 0) {
      toast({
        title: "No notices selected",
        description: "Please select at least one notice to export",
        variant: "destructive",
      });
      return;
    }

    if (selectedForms.length > 4) {
      toast({
        title: "Too many notices",
        description: "Please select up to 4 notices for printing",
        variant: "destructive",
      });
      return;
    }

    const selectedNotices = forms.filter(form => selectedForms.includes(form.id));
    
    // Create print window with 2x2 grid layout
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SPR Violation Notices</title>
          <style>
            @page { margin: 0.5in; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 20px; height: 100vh; }
            .notice { border: 2px solid #333; padding: 15px; break-inside: avoid; }
            .notice h3 { margin: 0 0 10px 0; font-size: 16px; font-weight: bold; }
            .notice p { margin: 5px 0; font-size: 12px; }
            .notice .label { font-weight: bold; }
            .notice img { max-width: 100%; height: auto; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="grid">
            ${selectedNotices.map(form => {
              // Format date from occurred_at or use legacy date/time
              let dateStr = '';
              if (form.occurred_at) {
                const dateObj = new Date(form.occurred_at);
                dateStr = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${dateObj.getFullYear()}`;
              } else if (form.date) {
                dateStr = form.date;
              }
              
              let timeStr = '';
              if (form.occurred_at) {
                const dateObj = new Date(form.occurred_at);
                timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              } else if (form.time) {
                timeStr = form.time;
              }
              
              return `
              <div class="notice">
                <h3>SPR Violation Notice</h3>
                <p><span class="label">Unit:</span> ${form.unit_number}</p>
                <p><span class="label">Date:</span> ${dateStr}</p>
                <p><span class="label">Time:</span> ${timeStr}</p>
                <p><span class="label">Location:</span> ${form.location}</p>
                <p><span class="label">Description:</span> ${form.description}</p>
                <p><span class="label">Status:</span> ${form.status}</p>
                ${form.photos && form.photos.length > 0 ? `
                  <p><span class="label">Photo:</span></p>
                  <img src="${form.photos[0]}" alt="Violation photo" />
                ` : ''}
              </div>
            `;
            }).join('')}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-vice-pink border-t-transparent mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-black/20 z-0" />
      
      {/* Animated waves */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden opacity-30 z-10">
        <div className="wave-bg h-16 bg-gradient-to-r from-vice-cyan to-vice-pink animate-wave-1"></div>
        <div className="wave-bg h-12 bg-gradient-to-r from-vice-pink to-vice-purple animate-wave-2 -mt-6"></div>
        <div className="wave-bg h-8 bg-gradient-to-r from-vice-blue to-vice-cyan animate-wave-3 -mt-4"></div>
      </div>

      {/* Lens flares */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-vice-cyan rounded-full opacity-20 blur-xl animate-lens-flare-1 z-10"></div>
      <div className="absolute top-20 right-16 w-16 h-16 bg-vice-pink rounded-full opacity-30 blur-lg animate-lens-flare-2 z-10"></div>
      <div className="absolute bottom-20 left-16 w-24 h-24 bg-vice-purple rounded-full opacity-15 blur-2xl animate-lens-flare-3 z-10"></div>
      <div className="absolute bottom-10 right-10 w-12 h-12 bg-vice-orange rounded-full opacity-25 blur-md animate-lens-flare-4 z-10"></div>

      {/* Content */}
      <div className="relative z-30 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-center p-6 bg-black backdrop-blur-sm border-b border-vice-cyan/20 relative">
          <img
            src="/Export.png"
            alt="Export"
            className="h-24 w-auto object-contain"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/10"
          >
            <Home className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-vice-cyan/60" />
              <Input
                placeholder="Search for notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/30 border-vice-cyan/30 text-white placeholder:text-vice-cyan/40 focus:border-vice-pink"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 bg-black/30 border-vice-cyan/30 text-white">
                <Filter className="h-4 w-4 mr-2 text-vice-cyan/60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-vice-cyan/30">
                <SelectItem value="all" className="text-white hover:bg-vice-cyan/20">All</SelectItem>
                <SelectItem value="saved" className="text-white hover:bg-vice-cyan/20">Saved</SelectItem>
                <SelectItem value="submitted" className="text-white hover:bg-vice-cyan/20">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Selection Card */}
          <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Select Notice(s) to Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Notices Display */}
              <div className="min-h-[100px] space-y-2">
                {selectedForms.length === 0 ? (
                  <p className="text-vice-cyan/60 text-center py-8">No notices selected</p>
                ) : (
                  selectedForms.map(formId => {
                    const form = forms.find(f => f.id === formId);
                    if (!form) return null;
                    return (
                      <div key={formId} className="flex items-center justify-between bg-black/20 p-3 rounded border border-vice-cyan/20">
                        <div>
                          <p className="text-white font-medium">Unit {form.unit_number}</p>
                          <p className="text-vice-cyan/80 text-sm">
                            {form.occurred_at ? new Date(form.occurred_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) : form.date} - {form.location}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSelectedForm(formId)}
                          className="text-vice-pink hover:bg-vice-pink/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>

              <Separator className="bg-vice-cyan/20" />

              {/* Export Actions */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleEmailExport}
                  className="flex-1 bg-gradient-to-r from-vice-cyan to-vice-blue hover:from-vice-blue hover:to-vice-cyan text-white"
                  disabled={selectedForms.length === 0}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                
                <Button
                  onClick={handlePrintExport}
                  className="flex-1 bg-gradient-to-r from-vice-pink to-vice-purple hover:from-vice-purple hover:to-vice-pink text-white"
                  disabled={selectedForms.length === 0}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
              
              {selectedForms.length > 0 && (
                <p className="text-vice-cyan/60 text-xs text-center">
                  {selectedForms.length} notice(s) selected {selectedForms.length > 4 && '(max 4 for print)'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* This Week Card */}
          <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => setIsThisWeekExpanded(!isThisWeekExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-vice-pink" />
                  <div>
                    <CardTitle className="text-white text-lg">This Week</CardTitle>
                    <p className="text-vice-cyan/80 text-sm">{thisWeekCount} forms</p>
                  </div>
                </div>
                {isThisWeekExpanded ? (
                  <ChevronUp className="h-5 w-5 text-vice-cyan" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-vice-cyan" />
                )}
              </div>
            </CardHeader>
            
            {isThisWeekExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {filteredForms.map((form) => (
                    <div key={form.id} className="flex items-start gap-3 p-3 bg-black/20 rounded border border-vice-cyan/20">
                      <Checkbox
                        checked={selectedForms.includes(form.id)}
                        onCheckedChange={(checked) => handleFormSelection(form.id, checked as boolean)}
                        className="mt-1 border-vice-cyan/40 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-medium">Unit {form.unit_number}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            form.status === 'submitted' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {form.status}
                          </span>
                        </div>
                        <p className="text-vice-cyan/80 text-sm mb-1">
                          {form.occurred_at ? (
                            new Date(form.occurred_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' at ' +
                            new Date(form.occurred_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                          ) : (
                            `${form.date} at ${form.time}`
                          )}
                        </p>
                        <p className="text-vice-cyan/80 text-sm mb-1">{form.location}</p>
                        <p className="text-white/90 text-sm">{form.description}</p>
                        {form.photos && form.photos.length > 0 && (
                          <p className="text-vice-pink text-xs mt-1">📷 {form.photos.length} photo(s)</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredForms.length === 0 && (
                    <p className="text-vice-cyan/60 text-center py-4">No forms found</p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}