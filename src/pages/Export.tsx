import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import { ViolationCarousel3D } from "../components/ViolationCarousel";
import { useToast } from '../hooks/use-toast';
import type { CheckedState } from '@radix-ui/react-checkbox';
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
import { normalizeUnit } from '@/utils/unitFormat';
import type { Tables } from '@/integrations/supabase/types';
 

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
  photos: string[]; // Photos array from violation_photos join
  violation_photos: Array<{
    id: string;
    storage_path: string;
    created_at: string;
  }>;
}

type ViolationFormRow = Tables<'violation_forms'>;
type ViolationPhotoRow = Tables<'violation_photos'>;

export default function Export() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [forms, setForms] = useState<ViolationForm[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  // Time filter: this_week | this_month | all
  const [timeFilter, setTimeFilter] = useState<'this_week' | 'this_month' | 'all'>('this_week');
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [isThisWeekExpanded, setIsThisWeekExpanded] = useState(true);

  const fetchForms = useCallback(async () => {
    try {
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
        .order('created_at', { ascending: false })
        .limit(500)
        .returns<(ViolationFormRow & { violation_photos: ViolationPhotoRow[] | null })[]>();

      if (error) throw error;

      const formsWithPhotos: ViolationForm[] = (data ?? []).map((form) => {
        const photosArray = Array.isArray(form.violation_photos)
          ? form.violation_photos.filter(
              (photo): photo is ViolationPhotoRow => Boolean(photo)
            )
          : [];

        return {
          id: String(form.id),
          unit_number: normalizeUnit(form.unit_number ?? ''),
          occurred_at: form.occurred_at ?? undefined,
          location: form.location ?? '',
          description: form.description ?? '',
          status: form.status ?? 'saved',
          created_at: form.created_at ?? new Date().toISOString(),
          photos: photosArray
            .map((photo) => photo.storage_path)
            .filter((path): path is string => typeof path === 'string' && path.length > 0),
          violation_photos: photosArray
            .map((photo) => ({
              id: String(photo.id),
              storage_path: photo.storage_path ?? '',
              created_at: photo.created_at ?? '',
            }))
            .filter((photo) => photo.storage_path.length > 0),
        };
      });

      setForms(formsWithPhotos);
    } catch (error: unknown) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load violation forms",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchForms();
    }
  }, [fetchForms, user]);

  const filteredForms = useMemo(() => {
    let filtered = [...forms];

    // Search filtering
    if (searchTerm) {
      const normalizedSearchUnit = normalizeUnit(searchTerm);
      const searchTermLower = searchTerm.toLowerCase();

      const matchesDate = (form: ViolationForm) => {
        const legacyDate = form.date?.toString() ?? '';
        const occurredAt = form.occurred_at ?? '';
        const occurredDate = occurredAt ? new Date(occurredAt) : null;
        const occurredMDY = occurredDate
          ? occurredDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).toLowerCase()
          : '';
        const occurredMD = occurredDate
          ? occurredDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }).toLowerCase()
          : '';
        const occurredLong = occurredDate
          ? occurredDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase()
          : '';

        return (
          legacyDate.toLowerCase().includes(searchTermLower) ||
          occurredAt.toLowerCase().includes(searchTermLower) ||
          occurredMDY.includes(searchTermLower) ||
          occurredMD.includes(searchTermLower) ||
          occurredLong.includes(searchTermLower)
        );
      };

      const normalizeViolationType = (location: string | null | undefined) => {
        if (!location) return '';
        let result = location;
        if (result.includes('Items/trash left outside unit')) {
          if (result.includes('(items)')) result = 'Items left outside unit';
          else if (result.includes('(trash)')) result = 'Trash left outside unit';
          else result = 'Items/trash left outside unit';
        } else if (result.includes('balcony railing')) {
          result = 'Items left on balcony railing';
        } else if (result.includes('front railing')) {
          result = 'Items left on front railing';
        }
        return result.toLowerCase();
      };

      filtered = filtered.filter((form) => {
        const normalizedUnit = normalizeUnit(form.unit_number);
        const unitMatch =
          (normalizedSearchUnit.length > 0 && normalizedUnit.includes(normalizedSearchUnit)) ||
          form.unit_number.toLowerCase().includes(searchTermLower);
        const descMatch = form.description.toLowerCase().includes(searchTermLower);
        const locationMatch = form.location.toLowerCase().includes(searchTermLower) ||
          normalizeViolationType(form.location).includes(searchTermLower);
        const dateMatch = matchesDate(form);
        return Boolean(unitMatch || descMatch || locationMatch || dateMatch);
      });
    }

    // Time-based filtering
    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let startDate: Date;
      if (timeFilter === 'this_week') {
        // Past 6 days + today = 7 days total
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6); // 6 days ago at 00:00:00
      } else {
        // this_month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      filtered = filtered.filter((form) => {
        const formDate = new Date(form.occurred_at || form.created_at);
        // Normalize to date only (ignore time)
        const formDateOnly = new Date(formDate.getFullYear(), formDate.getMonth(), formDate.getDate());
        return formDateOnly >= startDate;
      });
    }

    return filtered;
  }, [timeFilter, forms, searchTerm]);

  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Past 6 days + today = 7 days total
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 6);

    return forms.filter((form) => {
      const formDate = new Date(form.occurred_at || form.created_at);
      // Normalize to date only (ignore time)
      const formDateOnly = new Date(formDate.getFullYear(), formDate.getMonth(), formDate.getDate());
      return formDateOnly >= startOfWeek;
    }).length;
  }, [forms]);

  

  const handleFormSelection = (formId: string, checked: CheckedState) => {
    if (checked === true) {
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

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

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
        {/* Header with centered Export.png image */}
        <div className="relative flex items-center p-6 bg-black backdrop-blur-sm border-b border-vice-cyan/20 overflow-hidden">
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img
              src="/Export.png"
              alt="Export"
              className="h-24 w-auto object-contain"
            />
          </div>
          {/* Black gradient masks on all sides to blend logo */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
          <div className="ml-auto">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-vice-cyan/20 min-h-[44px] min-w-[44px]"
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Integrated Search + Filter */}
          <div className="max-w-xl mx-auto">
            <div className="flex items-stretch gap-0 rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-vice-cyan/30 bg-gradient-to-br from-black/50 via-black/40 to-black/30 backdrop-blur-sm">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vice-cyan/80" />
                <Input
                  placeholder="Search Unit #, Date, or Violation type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-transparent border-0 text-white placeholder:text-vice-cyan/70 min-h-[48px] w-full focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              {/* Divider */}
              <div className="self-stretch w-px bg-vice-cyan/30" />
              {/* Filter */}
              <div className="w-auto">
                <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as 'this_week' | 'this_month' | 'all')}>
                  <SelectTrigger className="h-[48px] bg-transparent border-0 text-white rounded-none justify-start px-3 w-auto">
                    <Filter className="w-4 h-4 mr-2 text-vice-cyan/80 flex-shrink-0" />
                    <SelectValue placeholder="Filter by time range" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-vice-cyan/50 w-auto">
                    <SelectItem value="this_week" className="text-white hover:bg-vice-cyan/20">This Week</SelectItem>
                    <SelectItem value="this_month" className="text-white hover:bg-vice-cyan/20">This Month</SelectItem>
                    <SelectItem value="all" className="text-white hover:bg-vice-cyan/20">All Forms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Export Selection Card */}
          <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] max-w-7xl mx-auto">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-vice-cyan">
                    {timeFilter === 'this_week' ? 'This Week' : timeFilter === 'this_month' ? 'This Month' : 'All Forms'}
                  </p>
                  <CardTitle className="text-white text-lg">{filteredForms.length}</CardTitle>
                </div>
                <Clock className="w-6 h-6 text-vice-pink" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {/* 3D Carousel (enlarged and centered) */}
              <div className="my-2 sm:my-3 -mx-2 sm:mx-0 flex items-center justify-center">
                <div className="w-full max-w-5xl">
                  <ViolationCarousel3D forms={filteredForms} heightClass="h-[160px] sm:h-[200px]" containerClassName="mx-auto" />
                </div>
              </div>
              {/* Selected Notices Display (only when selections exist) */}
              {selectedForms.length > 0 && (
                <div className="space-y-2 touch-manipulation mt-2">
                  {selectedForms.map(formId => {
                    const form = forms.find(f => f.id === formId);
                    if (!form) return null;
                    return (
                      <div key={formId} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-vice-cyan/20">
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
                  })}
                </div>
              )}

              {selectedForms.length > 0 && <Separator className="bg-vice-cyan/20 my-2" />}

              {/* Export Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-2">
                <Button
                  onClick={handleEmailExport}
                  className="flex-1 bg-gradient-to-r from-vice-cyan to-vice-blue hover:from-vice-blue hover:to-vice-cyan text-white min-h-[44px] rounded-lg"
                  disabled={selectedForms.length === 0}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                
                <Button
                  onClick={handlePrintExport}
                  className="flex-1 bg-gradient-to-r from-vice-pink to-vice-purple hover:from-vice-purple hover:to-vice-pink text-white min-h-[44px] rounded-lg"
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
        </div>
      </div>
    </div>
  );
}
