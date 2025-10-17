import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
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
  X
} from "lucide-react";
import type { Tables } from "../integrations/supabase/types";
import { normalizeUnit } from "@/utils/unitFormat";

type ViolationFormRow = Tables<"violation_forms">;
type ViolationPhotoRow = Tables<"violation_photos">;
type ProfileRow = Tables<"profiles">;
type ProfileSummary = Pick<ProfileRow, "email" | "full_name" | "role">;
type ProfileLookup = Pick<ProfileRow, "user_id" | "email" | "full_name" | "role">;

type ViolationFormWithRelations = ViolationFormRow & {
  violation_photos?: ViolationPhotoRow[] | null;
  profiles?: ProfileSummary | null;
  date?: string | null;
  time?: string | null;
};

interface SavedForm {
  id: string;
  user_id: string;
  unit_number: string;
  date: string | null;
  occurred_at: string | null;
  time: string | null;
  location: string | null;
  description: string | null;
  photos: string[];
  status: string | null;
  created_at: string;
  profiles?: ProfileSummary | null;
  violation_photos?: Array<{
    id: string;
    storage_path: string;
    created_at: string | null;
  }>;
}

const normalizeViolationForm = (
  form: ViolationFormWithRelations,
  fallbackProfile?: ProfileSummary | null
): SavedForm => {
  const violationPhotos = Array.isArray(form.violation_photos)
    ? form.violation_photos
    : [];

  const legacyFields = form as unknown as {
    date?: string | null;
    time?: string | null;
  };

  const mergedProfile = form.profiles ?? fallbackProfile ?? null;
  const normalizedProfile = mergedProfile
    ? {
        email: mergedProfile.email,
        full_name: mergedProfile.full_name,
        role: mergedProfile.role ?? "user",
      }
    : null;

  const normalizedUnit = normalizeUnit(form.unit_number ?? "");

  // Convert storage paths to full public URLs
  const photos = violationPhotos
    .map((photo) => {
      if (!photo?.storage_path) return null;
      const { data } = supabase.storage
        .from('violation-photos')
        .getPublicUrl(photo.storage_path);
      return data?.publicUrl || null;
    })
    .filter((url): url is string => typeof url === "string" && url.length > 0);

  return {
    id: String(form.id),
    user_id: form.user_id,
    unit_number: normalizedUnit,
    date: legacyFields.date ?? null,
    occurred_at: form.occurred_at ?? null,
    time: legacyFields.time ?? null,
    location: form.location ?? null,
    description: form.description ?? null,
    photos,
    status: form.status ?? "saved",
    created_at: form.created_at ?? new Date().toISOString(),
    profiles: normalizedProfile,
    violation_photos: violationPhotos.map((photo) => ({
      id: String(photo?.id),
      storage_path: photo?.storage_path ?? "",
      created_at: photo?.created_at ?? null,
    })),
  };
};

const sanitizeForms = (rows: unknown): ViolationFormWithRelations[] => {
  if (!Array.isArray(rows)) return [];

  return rows.filter((row): row is ViolationFormWithRelations => {
    if (!row || typeof row !== "object") return false;
    if ("error" in row) return false;
    return true;
  });
};

const sanitizeProfiles = (rows: unknown): ProfileLookup[] => {
  if (!Array.isArray(rows)) return [];

  return rows.filter((row): row is ProfileLookup => {
    if (!row || typeof row !== "object") return false;
    if ("error" in row) return false;
    return true;
  });
};

const Books = () => {
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Time filter like Export: this_week | this_month | all
  const [timeFilter, setTimeFilter] = useState<'this_week' | 'this_month' | 'all'>("this_week");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const location = useLocation();

  const fetchSavedForms = useCallback(async () => {
    if (!user) {
      // No authenticated user; stop loading so the auth redirect can render
      setLoading(false);
      return;
    }

    try {
      // Fetch violation forms with minimal columns and photos join
      // IMPORTANT: Fetches ALL forms from ALL users (team visibility)
      const { data: formsDataRaw, error: formsError } = await supabase
        .from('violation_forms')
        .select(`
          id,
          user_id,
          unit_number,
          occurred_at,
          location,
          description,
          status,
          created_at,
          violation_photos (
            id,
            storage_path,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (formsError) throw formsError;

      // Fetch all profiles (minimal columns)
      const { data: rawProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, role');

      if (profilesError) throw profilesError;

      const profilesData = sanitizeProfiles(rawProfiles);
      const formsData = sanitizeForms(formsDataRaw);

      // Manually join the data and map photos
      const formsWithProfiles = formsData.map(form => {
        const matchedProfile = profilesData.find(profile => profile.user_id === form.user_id) || null;
        const profileSummary = matchedProfile
          ? {
              email: matchedProfile.email,
              full_name: matchedProfile.full_name,
              role: matchedProfile.role ?? "user",
            }
          : null;

        return normalizeViolationForm(form, profileSummary);
      });

      setForms(formsWithProfiles);
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
  }, [toast, user]);

  useEffect(() => {
    fetchSavedForms();
  }, [fetchSavedForms, user]);

  // Refetch data when navigating to books page (e.g., after saving a new form)
  // Avoid immediate duplicate refetch when arriving on /books
  const hasRefetchedOnNav = useRef(false);
  useEffect(() => {
    if (location.pathname === '/books' && !loading && !hasRefetchedOnNav.current) {
      hasRefetchedOnNav.current = true;
      fetchSavedForms();
      // reset flag after a short interval to allow later navigations to refetch
      setTimeout(() => { hasRefetchedOnNav.current = false; }, 2000);
    }
  }, [fetchSavedForms, location.pathname, loading]);

  // No collapsibles now; no click-outside behavior needed

  // No collapsible handlers needed


  const applyFilters = (formsToFilter: SavedForm[]) => {
    let filtered = formsToFilter;

    // Apply search filter (now includes user names)
    if (searchTerm) {
      const normalizedSearchUnit = normalizeUnit(searchTerm);
      const searchTermLower = searchTerm.toLowerCase();

      const matchesDate = (form: SavedForm) => {
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
        const userMatch = form.profiles?.email?.toLowerCase().includes(searchTermLower) ||
          form.profiles?.full_name?.toLowerCase().includes(searchTermLower);
        const dateMatch = matchesDate(form);

        return Boolean(unitMatch || descMatch || locationMatch || userMatch || dateMatch);
      });
    }

    return filtered;
  };

  // Time-filtered set for the carousel matching Export.tsx
  const filteredForms = (() => {
    const base = applyFilters(forms);
    if (timeFilter === 'all') return base;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timeFilter === 'this_week') {
      // Past 6 days + today = 7 days total
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 6); // 6 days ago at 00:00:00
      return base.filter(form => {
        const formDate = new Date(form.occurred_at || form.created_at);
        // Normalize to date only (ignore time)
        const formDateOnly = new Date(formDate.getFullYear(), formDate.getMonth(), formDate.getDate());
        return formDateOnly >= startOfWeek;
      });
    }

    if (timeFilter === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return base.filter(form => {
        const formDate = new Date(form.occurred_at || form.created_at);
        return formDate >= startOfMonth;
      });
    }

    return base;
  })();

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
        </div>
        {/* Expanded carousel card - optimized for mobile portrait and landscape */}
        <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] max-w-7xl mx-auto 
                         min-h-[60vh] portrait:min-h-[60vh] landscape:min-h-[70vh] 
                         md:min-h-[400px] flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
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
          <CardContent className="pt-0 pb-3 flex-1 flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center -mx-2 sm:mx-0">
              <div className="w-full max-w-5xl h-full flex items-center">
                <ViolationCarousel3D 
                  forms={filteredForms} 
                  heightClass="h-[280px] portrait:h-[320px] landscape:h-[240px] sm:h-[280px] md:h-[320px]" 
                  containerClassName="mx-auto w-full" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Books;
