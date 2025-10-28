import { getThisWeekRange, getThisMonthRange, isDateInRange } from "@/utils/dateRanges";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  X,
  Film,
  Grid3X3
} from "lucide-react";
import type { Tables } from "../integrations/supabase/types";
import { normalizeUnit } from "@/utils/unitFormat";

type ViolationFormRow = Tables<"violation_forms">;
type ViolationPhotoRow = Tables<"violation_photos">;

// Using same interface as Export.tsx for consistency
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
  user_id?: string; // User who created the form
  user_name?: string; // Full name from profiles table
  photos: string[]; // Photos array from violation_photos join
  violation_photos: Array<{
    id: string;
    storage_path: string;
    created_at: string;
  }>;
}

const Books = () => {
  const [forms, setForms] = useState<ViolationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Time filter like Export: this_week | this_month | all
  const [timeFilter, setTimeFilter] = useState<'this_week' | 'this_month' | 'all'>("this_week");
  const [debouncedTimeFilter, setDebouncedTimeFilter] = useState<'this_week' | 'this_month' | 'all'>("this_week");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  

  const fetchSavedForms = useCallback(async () => {
    if (!user) {
      // No authenticated user; stop loading so the auth redirect can render
      setLoading(false);
      return;
    }

    try {
      // Server-side time filter (This Week default) with occurred_at priority
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let startDate: Date | null = null;
      if (debouncedTimeFilter === 'this_week') {
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(today.getDate() - 6);
      } else if (debouncedTimeFilter === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      let baseQuery = supabase
        .from('violation_forms')
        .select(`
          *,
          violation_photos (
            id,
            storage_path,
            created_at
          )
        `);
      // Apply occurred_at filter for both this_week and this_month
      if ((debouncedTimeFilter === 'this_week' || debouncedTimeFilter === 'this_month') && startDate) {
        baseQuery = baseQuery.gte('occurred_at', startDate.toISOString());
      }

      // Also apply created_at filter as a fallback
      if (startDate) {
        const startIso = startDate.toISOString();
        baseQuery = baseQuery.filter('created_at', 'gte', startIso);
      }

      // Smart query limits optimized for carousel buffering during "season" (60+ violations)
      // Carousel will buffer/paginate on the client side for performance
      const queryLimit = debouncedTimeFilter === 'all' ? 100 : // Reduced for performance during season
                         debouncedTimeFilter === 'this_month' ? 75 : // Month view optimized
                         50; // This week should be manageable
      
      const { data, error } = await baseQuery
        .order('created_at', { ascending: false })
        .order('created_at', { foreignTable: 'violation_photos', ascending: false })
        .limit(queryLimit)
        .limit(1, { foreignTable: 'violation_photos' });

  if (error) throw error;

  // Map forms with photos and user profile data
      const formsWithPhotos: ViolationForm[] = (data ?? []).map((form) => {
        const photosArray = Array.isArray(form.violation_photos)
          ? form.violation_photos.filter(
              (photo): photo is ViolationPhotoRow => Boolean(photo)
            )
          : [];

        // Note: Profile data removed due to missing FK - user search disabled for now
        const userName = 'Team Member';

        const mappedForm = {
          id: String(form.id),
          unit_number: normalizeUnit(form.unit_number ?? ''),
          occurred_at: form.occurred_at ?? undefined,
          location: form.location ?? '',
          description: form.description ?? '',
          status: form.status ?? 'saved',
          created_at: form.created_at ?? new Date().toISOString(),
          user_id: form.user_id ?? undefined,
          user_name: userName,
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
        
        return mappedForm;
      });

      setForms(formsWithPhotos);
    } catch (error: unknown) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: "Failed to load violation forms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user, debouncedTimeFilter]);

  useEffect(() => {
    fetchSavedForms();
  }, [fetchSavedForms, user]);

  // Debounce time filter changes to prevent multiple rapid API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTimeFilter(timeFilter);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [timeFilter]);

  // Removed duplicate refetch-on-navigation to prevent double queries

  // No collapsibles now; no click-outside behavior needed

  // No collapsible handlers needed


  const applyFilters = (formsToFilter: ViolationForm[]) => {
    let filtered = formsToFilter;

    // Apply search filter (now includes user names)
    if (searchTerm) {
      const normalizedSearchUnit = normalizeUnit(searchTerm);
      const searchTermLower = searchTerm.toLowerCase();

      const matchesDate = (form: ViolationForm) => {
        // Support matching against legacy `date` (e.g., MM/DD) and `occurred_at` (ISO)
        const legacyDate = form.date?.toString() ?? '';
        const occurredAt = form.occurred_at ?? '';
        // Build a few comparable formats
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

      filtered = filtered.filter(form => {
        const unitMatch =
          (normalizedSearchUnit.length > 0 && normalizeUnit(form.unit_number).includes(normalizedSearchUnit)) ||
          form.unit_number?.toLowerCase().includes(searchTermLower);

        const descMatch = form.description?.toLowerCase().includes(searchTermLower);
        const locationMatch = form.location?.toLowerCase().includes(searchTermLower) ||
          normalizeViolationType(form.location).includes(searchTermLower);
        const dateMatch = matchesDate(form);
        
        // User name search - matches full name or first name
        const userMatch = form.user_name?.toLowerCase().includes(searchTermLower);

        return Boolean(unitMatch || descMatch || locationMatch || dateMatch || userMatch);
      });
    }

    return filtered;
  };

  // Time-filtered set for the carousel matching Export.tsx (memoized)
  const filteredForms = useMemo(() => {
    const base = applyFilters(forms);
    if (debouncedTimeFilter === 'all') return base;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (debouncedTimeFilter === 'this_week') {
        const { start: startOfWeek, end: endOfToday } = getThisWeekRange();
        return base.filter(form => {
          const timestamp = form.occurred_at || form.created_at;
          return isDateInRange(timestamp, { start: startOfWeek, end: endOfToday });
        });
    }

    if (debouncedTimeFilter === 'this_month') {
        const { start: startOfMonth, end: endOfToday } = getThisMonthRange();
        return base.filter(form => {
          const timestamp = form.occurred_at || form.created_at;
          return isDateInRange(timestamp, { start: startOfMonth, end: endOfToday });
        });
    }

    return base;
  }, [forms, searchTerm, debouncedTimeFilter]);

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

  // If not loading and no user, redirect to auth like Export.tsx
  if (!user) {
    return <Navigate to="/auth" replace />;
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
      <div className="w-full max-w-7xl mx-auto px-4 pb-2 md:pb-6">
        {/* Integrated Search + Filter */}
        <div className="py-3">
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
                    <SelectValue placeholder="Filter by time range" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-vice-cyan/50 w-auto">
                    <SelectItem value="this_week" className="text-white hover:bg-vice-cyan/20">
                      <div className="flex items-center gap-2">
                        <Film className={`w-4 h-4 ${timeFilter === 'this_week' ? 'text-vice-pink' : 'text-vice-cyan'}`} />
                        <span>This Week</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="this_month" className="text-white hover:bg-vice-cyan/20">
                      <div className="flex items-center gap-2">
                        <Film className={`w-4 h-4 ${timeFilter === 'this_month' ? 'text-vice-pink' : 'text-vice-cyan'}`} />
                        <span>This Month</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="all" className="text-white hover:bg-vice-cyan/20">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className={`w-4 h-4 ${timeFilter === 'all' ? 'text-vice-pink' : 'text-vice-cyan'}`} />
                        <span>All Forms</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        {/* Expanded carousel card - maximized for mobile carousel display */}
        <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] max-w-7xl mx-auto 
                         min-h-[65vh] portrait:min-h-[65vh] landscape:min-h-[75vh] 
                         md:min-h-[400px] flex flex-col">
          <CardHeader className="pb-1 pt-3 px-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-vice-cyan">
                  {timeFilter === 'this_week' ? 'This Week' : timeFilter === 'this_month' ? 'This Month' : 'All Forms'}
                </p>
                <CardTitle className="text-white text-lg">{filteredForms.length}</CardTitle>
              </div>
              <Clock className="w-5 h-5 text-vice-pink" />
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-2 px-2 flex-1 flex items-center justify-center">
            <ViolationCarousel3D 
              forms={filteredForms} 
              heightClass={debouncedTimeFilter === 'all' ? "h-[400px] sm:h-[500px]" : "h-[280px] portrait:h-[300px] landscape:h-[240px] sm:h-[280px] md:h-[320px]"} 
              containerClassName="w-full"
              displayMode={debouncedTimeFilter === 'all' ? 'grid' : '3d-carousel'}
            />
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Books;
