import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../hooks/use-toast";
import { ViolationCarousel3D } from "../components/ViolationCarousel";
import {
  BookOpen,
  Calendar,
  MapPin,
  Clock,
  Image as ImageIcon,
  Home,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";

interface SavedForm {
  id: string;
  user_id: string;
  unit_number: string;
  date: string;
  time: string;
  location: string;
  description: string;
  photos: string[];
  status: string;
  created_at: string;
  // Add user profile information - make it optional since the join might fail
  profiles?: {
    email: string;
    full_name: string | null;
    role: string;
  } | null;
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
  const filterRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const location = useLocation();

  useEffect(() => {
    fetchSavedForms();
  }, [user]);

  // Refetch data when navigating to books page (e.g., after saving a new form)
  useEffect(() => {
    if (location.pathname === '/books' && !loading) {
      console.log('Navigated to books page, refreshing data...');
      fetchSavedForms();
    }
  }, [location.pathname, loading]);

  // Click outside handler for filter dropdown and card expansion
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle filter dropdown
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }

      // Handle card expansion - collapse when clicking outside the cards container
      if (cardsContainerRef.current && !cardsContainerRef.current.contains(event.target as Node)) {
        setThisWeekExpanded(false);
        setThisMonthExpanded(false);
      }
    };

    if (filterOpen || thisWeekExpanded || thisMonthExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterOpen, thisWeekExpanded, thisMonthExpanded]);

  // Handle single card expansion - only one can be open at a time
  const handleWeekExpansion = (isExpanded: boolean) => {
    if (isExpanded) {
      setThisMonthExpanded(false); // Close month card when week opens
    }
    setThisWeekExpanded(isExpanded);
  };

  const handleMonthExpansion = (isExpanded: boolean) => {
    if (isExpanded) {
      setThisWeekExpanded(false); // Close week card when month opens
    }
    setThisMonthExpanded(isExpanded);
  };

  const fetchSavedForms = async () => {
    if (!user) return;

    try {
      // First, try to fetch with the join
      let { data, error } = await supabase
        .from('violation_forms')
        .select(`
          *,
          profiles!violation_forms_user_id_fkey (
            email,
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      // If the join fails, fall back to separate queries
      if (error || !data) {
        console.log('Join query failed, falling back to separate queries:', error);

        // Fetch violation forms
        const { data: formsData, error: formsError } = await supabase
          .from('violation_forms')
          .select('*')
          .order('created_at', { ascending: false });

        if (formsError) throw formsError;

        // Fetch all profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email, full_name, role');

        if (profilesError) throw profilesError;

        // Manually join the data
        const formsWithProfiles = (formsData || []).map(form => ({
          ...form,
          profiles: profilesData?.find(profile => profile.user_id === form.user_id) || null
        }));

        setForms(formsWithProfiles);
      } else {
        // Type assertion to handle the Supabase response
        const formsWithProfiles = (data || []) as unknown as SavedForm[];
        setForms(formsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: "Failed to load violation forms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (formsToFilter: SavedForm[]) => {
    let filtered = formsToFilter;

    // Apply search filter (now includes user names)
    if (searchTerm) {
      filtered = filtered.filter(form =>
        form.unit_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return applyFilters(forms.filter(form => new Date(form.created_at) >= weekAgo));
  };

  const getThisMonthForms = () => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return applyFilters(forms.filter(form => new Date(form.created_at) >= monthAgo));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';

    // If the time already includes AM/PM, return as is
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }

    // Otherwise, try to parse it as HH:MM format
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString; // Return original if parsing fails
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center px-4">
        <div className="text-center">
          <BookOpen className="h-8 w-8 animate-pulse text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading team violations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-vice-purple via-black to-vice-blue">
      {/* Header with centered Books.png image */}
      <div className="relative flex items-center p-6 bg-black/20 backdrop-blur-sm border-b border-vice-cyan/20">
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <img
            src="/Books.png"
            alt="Books"
            className="h-24 w-auto object-contain"
          />
        </div>
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

      {/* Main Content Container */}
      <div className="w-full max-w-7xl mx-auto px-4 pb-6">
        {/* Search and Filter - Centered */}
        <div className="py-4">
          <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vice-cyan" />
              <Input
                placeholder="Search by unit, description, location, or team member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/30 border-vice-cyan/50 text-white placeholder:text-vice-cyan/70 min-h-[44px] w-full"
              />
            </div>

            <div className="relative" ref={filterRef}>
              <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-black/30 border-vice-cyan/50 text-white hover:bg-vice-cyan/20 min-h-[44px] px-6"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    {filterOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 z-10 w-48">
                  <Card className="bg-black/90 border-vice-cyan/50 backdrop-blur-sm">
                    <CardContent className="p-3 space-y-2">
                      {["all", "saved", "completed"].map((filter) => (
                        <Button
                          key={filter}
                          variant={selectedFilter === filter ? "default" : "ghost"}
                          size="sm"
                          onClick={() => {
                            setSelectedFilter(filter);
                            setFilterOpen(false);
                          }}
                          className="w-full justify-start text-white hover:bg-vice-cyan/20 min-h-[44px]"
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
        </div>

        {/* Dashboard Stats - Vertically Stacked and Centered */}
        <div className="py-4">
          <div className="flex flex-col items-center gap-4 max-w-[560px] mx-auto" ref={cardsContainerRef}>
            {/* This Week Card */}
            <div className={`w-full ${thisWeekExpanded ? 'order-first' : ''}`}>
              <Collapsible open={thisWeekExpanded} onOpenChange={handleWeekExpansion} className="w-full">
                <CollapsibleTrigger asChild>
                  <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm hover:border-vice-pink/50 transition-colors cursor-pointer w-full">
                    <CardContent className="p-4">
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
                <CollapsibleContent className="mt-4">
                  <ViolationCarousel3D forms={getThisWeekForms()} />
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* This Month Card */}
            <div className={`w-full ${thisMonthExpanded && !thisWeekExpanded ? 'order-first' : ''}`}>
              <Collapsible open={thisMonthExpanded} onOpenChange={handleMonthExpansion} className="w-full">
                <CollapsibleTrigger asChild>
                  <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm hover:border-vice-pink/50 transition-colors cursor-pointer w-full">
                    <CardContent className="p-4">
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
                <CollapsibleContent className="mt-4">
                  <ViolationCarousel3D forms={getThisMonthForms()} />
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
        <div className="flex justify-center py-6">
          <Button
            onClick={() => setShowFullLibrary(true)}
            variant="outline"
            size="lg"
            className="bg-black/30 border-vice-cyan/50 text-white hover:bg-vice-cyan/20 px-8 py-3 min-h-[44px]"
          >
            <BookOpen className="w-6 h-6 mr-2" />
            Full Library
          </Button>
        </div>

        {/* Forms Display */}
        <div className="space-y-6">
          {filteredForms.length === 0 && forms.length > 0 ? (
            <div className="text-center py-8">
              <p className="text-vice-cyan/70">
                Try adjusting your search terms or filter settings.
              </p>
            </div>
          ) : (
            /* Dashboard List View */
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white text-center">
                {searchTerm ? `Search Results (${filteredForms.length})` : 'All Forms'}
              </h3>

              {filteredForms.map((form) => (
                <Card
                  key={form.id}
                  className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm hover:border-vice-pink/50 transition-all duration-200 max-w-4xl mx-auto"
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold text-white flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="truncate">Unit {form.unit_number}</span>
                          <Badge className={`self-start ${form.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-vice-pink/20 text-vice-pink border-vice-pink/30'}`}>
                            {form.status}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-vice-cyan/80 mt-1 break-words">
                          {form.description}
                        </p>
                      </div>

                      <div className="text-xs text-vice-cyan/60 flex-shrink-0">
                        {form.status === 'completed' ? 'Completed' : 'Saved'} {formatDate(form.created_at)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-vice-cyan/70">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{formatDate(form.date)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-vice-cyan/70">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{formatTime(form.time)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-vice-cyan/70">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{form.location}</span>
                      </div>

                      <div className="flex items-center gap-2 text-vice-cyan/70">
                        <ImageIcon className="w-4 h-4 flex-shrink-0" />
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

      {/* Full Library Modal */}
      {showFullLibrary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-vice-purple/20 via-black/90 to-vice-blue/20 border border-vice-cyan/30 rounded-lg w-full max-w-7xl max-h-[90dvh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-vice-cyan/30">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-vice-pink" />
                <span className="truncate">Full Library ({forms.length} Forms)</span>
              </h2>
              <Button
                onClick={() => setShowFullLibrary(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-vice-cyan/20 min-h-[44px] min-w-[44px] flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90dvh-120px)] p-4 sm:p-6">
              {forms.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-vice-cyan mx-auto mb-4 opacity-50" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {forms.map((form) => (
                    <Card
                      key={form.id}
                      className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm hover:border-vice-pink/50 transition-all duration-200"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold text-white flex flex-col gap-2">
                              <span className="truncate">Unit {form.unit_number}</span>
                              <div className="flex items-center gap-2">
                                <Badge className={`self-start ${form.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-vice-pink/20 text-vice-pink border-vice-pink/30'}`}>
                                  {form.status}
                                </Badge>
                                <span className="text-xs text-vice-pink font-normal">
                                  by {form.profiles?.full_name || form.profiles?.email || 'Unknown User'}
                                </span>
                              </div>
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-vice-cyan/70 mt-1">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{formatDate(form.date)}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-3">
                        <div>
                          <p className="text-xs font-medium text-vice-cyan mb-1">Description</p>
                          <p className="text-sm text-white break-words">{form.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-vice-cyan/70">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{formatTime(form.time)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-vice-cyan/70">
                            <ImageIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{form.photos.length} photo{form.photos.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-vice-cyan mb-1">Location</p>
                          <div className="flex items-center gap-2 text-sm text-white">
                            <MapPin className="w-4 h-4 text-vice-cyan/70 flex-shrink-0" />
                            <span className="break-words">{form.location}</span>
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