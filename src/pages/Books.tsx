import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Calendar,
  MapPin,
  Clock,
  Image as ImageIcon,
  Home,
  Search,
  Filter,
  Printer,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

const Books = () => {
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [thisWeekExpanded, setThisWeekExpanded] = useState(false);
  const [thisMonthExpanded, setThisMonthExpanded] = useState(false);
  const [showFullLibrary, setShowFullLibrary] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      setLoading(false);
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

  const filteredForms = applyFilters(forms);

  const getThisWeekForms = () => {
    const thisWeekForms = forms.filter(form => 
      new Date().getTime() - new Date(form.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    return applyFilters(thisWeekForms);
  };

  const getThisMonthForms = () => {
    const thisMonthForms = forms.filter(form => 
      new Date(form.created_at).getMonth() === new Date().getMonth()
    );
    return applyFilters(thisMonthForms);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-8 w-8 animate-pulse text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading your books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-vice-cyan/20">
        <Button 
          onClick={() => navigate('/export')}
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-vice-cyan/20"
        >
          <Printer className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold vice-block-letters text-white">Books</h1>
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

      {/* Dashboard Stats */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
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
                        <div>
                          <p className="text-sm font-medium text-white">Unit {form.unit_number}</p>
                          <p className="text-xs text-vice-cyan/70">{form.description}</p>
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
            
            <Collapsible open={thisMonthExpanded} onOpenChange={setThisMonthExpanded}>
              <CollapsibleTrigger asChild>
                <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm hover:border-vice-pink/50 transition-colors cursor-pointer">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-vice-cyan">This Month</p>
                        <p className="text-lg font-bold text-white">
                          {getThisMonthForms().length}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-vice-pink" />
                        {thisMonthExpanded ? <ChevronUp className="w-4 h-4 text-vice-cyan" /> : <ChevronDown className="w-4 h-4 text-vice-cyan" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {getThisMonthForms().map((form) => (
                  <Card key={form.id} className="bg-black/60 border-vice-cyan/20 backdrop-blur-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">Unit {form.unit_number}</p>
                          <p className="text-xs text-vice-cyan/70">{form.description}</p>
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
        
        {/* Full Library Button */}
        <div className="flex justify-center mt-6">
          <Button 
            onClick={() => setShowFullLibrary(true)}
            variant="outline"
            size="lg"
            className="bg-black/30 border-vice-cyan/50 text-white hover:bg-vice-cyan/20 px-8 py-3"
          >
            <BookOpen className="w-6 h-6 mr-2" />
            Full Library
          </Button>
        </div>

      <div className="p-4 space-y-6 max-w-6xl mx-auto">
        {/* Forms Display */}
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
          /* Dashboard List View */
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

      {/* Full Library Modal */}
      {showFullLibrary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-vice-purple/20 via-black/90 to-vice-blue/20 border border-vice-cyan/30 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-vice-cyan/30">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-vice-pink" />
                Full Library ({forms.length} Forms)
              </h2>
              <Button
                onClick={() => setShowFullLibrary(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-vice-cyan/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              {forms.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-vice-cyan mx-auto mb-4 opacity-50" />
                  <p className="text-vice-cyan/70">
                    Complete forms and save them from the Details tab to see them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {forms.map((form) => (
                    <Card 
                      key={form.id} 
                      className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm hover:border-vice-pink/50 transition-all duration-200"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                              Unit {form.unit_number}
                              <Badge className={form.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-vice-pink/20 text-vice-pink border-vice-pink/30'}>
                                {form.status}
                              </Badge>
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-vice-cyan/70 mt-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(form.date)}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 space-y-3">
                        <div>
                          <p className="text-xs font-medium text-vice-cyan mb-1">Description</p>
                          <p className="text-sm text-white">{form.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-vice-cyan/70">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(form.time)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-vice-cyan/70">
                            <ImageIcon className="w-4 h-4" />
                            <span>{form.photos.length} photo{form.photos.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-vice-cyan mb-1">Location</p>
                          <div className="flex items-center gap-2 text-sm text-white">
                            <MapPin className="w-4 h-4 text-vice-cyan/70" />
                            <span>{form.location}</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-vice-cyan/60 pt-2 border-t border-vice-cyan/20">
                          {form.status === 'completed' ? 'Completed' : 'Saved'} {formatDate(form.created_at)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;