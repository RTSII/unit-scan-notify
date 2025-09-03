import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2,
  Home,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Mail,
  Printer,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";

interface SavedForm {
  id: string;
  unit_number: string;
  date: string;
  time: string;
  location: string;
  description: string;
  photos: string[];
  status: string;
  created_at: string;
}

const Export = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [thisWeekExpanded, setThisWeekExpanded] = useState(false);
  const [selectedNotices, setSelectedNotices] = useState<string[]>([]);

  useEffect(() => {
    fetchSavedForms();
  }, [user]);

  const fetchSavedForms = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('violation_forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: "Failed to load saved forms",
        variant: "destructive",
      });
    } finally {
      setLoadingForms(false);
    }
  };

  const applyFilters = (formsToFilter: SavedForm[]) => {
    let filtered = formsToFilter;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(form =>
        form.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(form => form.status === selectedFilter);
    }

    return filtered;
  };

  const getThisWeekForms = () => {
    const thisWeekForms = forms.filter(form => 
      new Date().getTime() - new Date(form.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    return applyFilters(thisWeekForms);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleNoticeSelection = (formId: string) => {
    setSelectedNotices(prev => 
      prev.includes(formId) 
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  const handleEmailExport = () => {
    if (selectedNotices.length === 0) {
      toast({
        title: "No Notices Selected",
        description: "Please select at least one notice to email",
        variant: "destructive",
      });
      return;
    }

    const selectedForms = forms.filter(form => selectedNotices.includes(form.id));
    const emailBody = selectedForms.map(form => 
      `Unit: ${form.unit_number}\nDate: ${form.date}\nTime: ${form.time}\nLocation: ${form.location}\nDescription: ${form.description}\n\n`
    ).join('');

    const subject = `Violation Notice Export - ${selectedForms.length} Notice${selectedForms.length !== 1 ? 's' : ''}`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    window.location.href = mailtoLink;
    
    toast({
      title: "Email Prepared",
      description: `${selectedNotices.length} notice${selectedNotices.length !== 1 ? 's' : ''} ready to email`,
    });
  };

  const handlePrintExport = () => {
    if (selectedNotices.length === 0) {
      toast({
        title: "No Notices Selected",
        description: "Please select at least one notice to print",
        variant: "destructive",
      });
      return;
    }

    if (selectedNotices.length > 4) {
      toast({
        title: "Too Many Notices",
        description: "Please select up to 4 notices for optimal printing",
        variant: "destructive",
      });
      return;
    }

    // Create print-friendly content
    const selectedForms = forms.filter(form => selectedNotices.includes(form.id));
    const printContent = selectedForms.map(form => `
      <div style="border: 1px solid #ccc; padding: 10px; margin: 5px; page-break-inside: avoid;">
        <h3>Unit ${form.unit_number}</h3>
        <p><strong>Date:</strong> ${form.date}</p>
        <p><strong>Time:</strong> ${form.time}</p>
        <p><strong>Location:</strong> ${form.location}</p>
        <p><strong>Description:</strong> ${form.description}</p>
      </div>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Violation Notices</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
              @media print { .grid { grid-template-columns: 1fr 1fr; } }
            </style>
          </head>
          <body>
            <div class="grid">${printContent}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }

    toast({
      title: "Print Ready",
      description: `${selectedNotices.length} notice${selectedNotices.length !== 1 ? 's' : ''} sent to printer`,
    });
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

  if (loadingForms) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading export data...</p>
        </div>
      </div>
    );
  }

  const filteredForms = applyFilters(forms);

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-vice-cyan/20">
        <div className="w-10" /> {/* Spacer for centering */}
        <h1 className="text-2xl font-bold vice-block-letters text-white">Export</h1>
        <Button 
          onClick={() => navigate('/')}
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-vice-cyan/20"
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vice-cyan" />
            <Input
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black/30 border-vice-cyan/50 text-white placeholder:text-vice-cyan/70"
            />
          </div>

          <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="bg-black/30 border-vice-cyan/50 text-white hover:bg-vice-cyan/20">
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {filterOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute right-4 top-full mt-2 z-10">
              <Card className="bg-black/90 border-vice-cyan/50 backdrop-blur-sm">
                <CardContent className="p-3 space-y-2">
                  {["all", "saved", "completed"].map((filter) => (
                    <Button
                      key={filter}
                      variant={selectedFilter === filter ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedFilter(filter)}
                      className="w-full justify-start text-white hover:bg-vice-cyan/20"
                    >
                      {filter === "all" ? "All Forms" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Export Selection Card */}
      <div className="p-4">
        <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-center">Select Notice(s) to Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Notices Display Area */}
            <div className="min-h-[120px] border border-vice-cyan/30 rounded-lg p-4 bg-black/20">
              {selectedNotices.length === 0 ? (
                <div className="flex items-center justify-center h-full text-vice-cyan/60">
                  <p>No notices selected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-vice-cyan text-sm mb-3">
                    {selectedNotices.length} notice{selectedNotices.length !== 1 ? 's' : ''} selected:
                  </p>
                  {selectedNotices.map(noticeId => {
                    const form = forms.find(f => f.id === noticeId);
                    return form ? (
                      <div key={noticeId} className="flex items-center justify-between bg-black/30 rounded p-2 border border-vice-cyan/20">
                        <span className="text-white text-sm">Unit {form.unit_number} - {form.description}</span>
                        <Button
                          onClick={() => handleNoticeSelection(noticeId)}
                          variant="ghost"
                          size="sm"
                          className="text-vice-pink hover:bg-vice-pink/20 p-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-vice-cyan/30"></div>

            {/* Export Actions */}
            <div className="flex justify-center gap-8">
              <Button
                onClick={handleEmailExport}
                disabled={selectedNotices.length === 0}
                variant="outline"
                className="bg-black/30 border-vice-cyan/50 text-white hover:bg-vice-cyan/20 flex items-center gap-2 px-6 py-3"
              >
                <Mail className="w-5 h-5" />
                Email
              </Button>
              
              <Button
                onClick={handlePrintExport}
                disabled={selectedNotices.length === 0}
                variant="outline"
                className="bg-black/30 border-vice-cyan/50 text-white hover:bg-vice-cyan/20 flex items-center gap-2 px-6 py-3"
              >
                <Printer className="w-5 h-5" />
                Print
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This Week Card */}
      <div className="p-4">
        <div className="max-w-2xl">
          <Collapsible open={thisWeekExpanded} onOpenChange={setThisWeekExpanded}>
            <CollapsibleTrigger asChild>
              <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm hover:border-vice-pink/50 transition-colors cursor-pointer">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-vice-cyan">This Week</p>
                      <p className="text-lg font-bold text-white">
                        {getThisWeekForms().length}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-6 h-6 text-vice-pink" />
                      {thisWeekExpanded ? <ChevronUp className="w-4 h-4 text-vice-cyan" /> : <ChevronDown className="w-4 h-4 text-vice-cyan" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {getThisWeekForms().map((form) => (
                <Card key={form.id} className="bg-black/60 border-vice-cyan/20 backdrop-blur-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedNotices.includes(form.id)}
                          onCheckedChange={() => handleNoticeSelection(form.id)}
                          className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                        />
                        <div>
                          <p className="text-sm font-medium text-white">Unit {form.unit_number}</p>
                          <p className="text-xs text-vice-cyan/70">{form.description}</p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${form.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-vice-pink/20 text-vice-pink border-vice-pink/30'}`}>
                        {form.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* All Forms List */}
      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        {filteredForms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-vice-cyan/70">
              {forms.length === 0 
                ? 'Complete forms and save them from the Details tab to see them here.'
                : 'Try adjusting your search terms or filter settings.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              {searchTerm ? `Search Results (${filteredForms.length})` : 'All Forms'}
            </h3>
            
            {filteredForms.map((form) => (
              <Card 
                key={form.id} 
                className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm hover:border-vice-pink/50 transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedNotices.includes(form.id)}
                        onCheckedChange={() => handleNoticeSelection(form.id)}
                        className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                      />
                      <div>
                        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                          Unit {form.unit_number}
                          <Badge className={form.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-vice-pink/20 text-vice-pink border-vice-pink/30'}>
                            {form.status}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-vice-cyan/80 mt-1">
                          {form.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-vice-cyan/60">
                      {form.status === 'completed' ? 'Completed' : 'Saved'} {formatDate(form.created_at)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-vice-cyan/70">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(form.date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-vice-cyan/70">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(form.time)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-vice-cyan/70">
                      <MapPin className="w-4 h-4" />
                      <span>{form.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-vice-cyan/70">
                      <ImageIcon className="w-4 h-4" />
                      <span>{form.photos.length} photo{form.photos.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Export;