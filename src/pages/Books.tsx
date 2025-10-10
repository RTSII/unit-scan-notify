import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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

  return {
    id: String(form.id),
    user_id: form.user_id,
    unit_number: normalizedUnit,
    date: legacyFields.date ?? null,
    occurred_at: form.occurred_at ?? null,
    time: legacyFields.time ?? null,
    location: form.location ?? null,
    description: form.description ?? null,
    photos: violationPhotos
      .map((photo) => photo?.storage_path)
      .filter((path): path is string => typeof path === "string" && path.length > 0),
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

const VIOLATION_FORM_JOIN = `
  *,
  profiles!violation_forms_user_id_fkey (
    email,
    full_name,
    role
  ),
  violation_photos (
    id,
    storage_path,
    created_at
  )
` as const;

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
    if (!user) return;

    try {
      // First, try to fetch with the join (including violation_photos)
      // IMPORTANT: Fetches ALL forms from ALL users (not filtered by user_id)
      // This allows all team members to view all violation forms
      const { data, error } = await supabase
        .from('violation_forms')
        .select(VIOLATION_FORM_JOIN)
        .order('created_at', { ascending: false });

      // If the join fails, fall back to separate queries
      if (error || !data) {
        console.log('Join query failed, falling back to separate queries:', error);

        // Fetch violation forms with photos join
        // IMPORTANT: Fetches ALL forms from ALL users (not filtered by user_id)
        // This allows all team members to view all violation forms
        const { data: formsDataRaw, error: formsError } = await supabase
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

        if (formsError) throw formsError;

        // Fetch all profiles
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

        // Debug: See all fetched forms with details
        console.log('Forms fetched:', formsWithProfiles);
        console.log('📊 FORM DETAILS:');
        formsWithProfiles.forEach((f, idx) => {
          console.log(`Form ${idx + 1}:`, {
            id: f.id,
            unit: f.unit_number,
            date: f.date,
            occurred_at: f.occurred_at,
            photos: f.photos,
            photoCount: f.photos.length,
            photoType: typeof f.photos,
            firstPhoto: f.photos[0] ? `${f.photos[0].substring(0, 50)}...` : null,
            location: f.location
          });
        });

        // Debug: See all fetched forms
        console.log('Forms fetched:', formsWithProfiles);
        setForms(formsWithProfiles);
      } else {
        // Map the data to include photos array from violation_photos join
        const typedData = sanitizeForms(data);
        const formsWithProfiles = typedData.map(form => normalizeViolationForm(form));
        // Debug: See all fetched forms
        console.log('Forms fetched (with join):', formsWithProfiles);
        setForms(formsWithProfiles);
      }
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
  useEffect(() => {
    if (location.pathname === '/books' && !loading) {
      console.log('Navigated to books page, refreshing data...');
      fetchSavedForms();
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

      filtered = filtered.filter(form =>
        (normalizedSearchUnit.length > 0 && normalizeUnit(form.unit_number).includes(normalizedSearchUnit)) ||
        form.unit_number?.toLowerCase().includes(searchTermLower) ||
        form.description?.toLowerCase().includes(searchTermLower) ||
        form.location?.toLowerCase().includes(searchTermLower) ||
        form.profiles?.email?.toLowerCase().includes(searchTermLower) ||
        form.profiles?.full_name?.toLowerCase().includes(searchTermLower)
      );
    }

    return filtered;
  };

  // Time-filtered set for the carousel matching Export.tsx
  const filteredForms = (() => {
    const base = applyFilters(forms);
    if (timeFilter === 'all') return base;
    const now = new Date();
    let startDate: Date;
    if (timeFilter === 'this_week') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - startDate.getDay());
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return base.filter(form => new Date(form.created_at) >= startDate);
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
        {/* Search and Filter - Centered (consistent with Export.tsx) */}
        <div className="py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-center">
              <div className="relative flex-[2] md:max-w-[480px] w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vice-cyan/80" />
                <Input
                  placeholder="Search by unit, description, location, or team member..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/30 border-vice-cyan/50 text-white placeholder:text-vice-cyan/70 min-h-[44px] w-full rounded-lg shadow-[0_0_0_1px_rgba(0,255,255,0.15)] focus:shadow-[0_0_0_2px_rgba(255,20,147,0.35)]"
                />
              </div>

              <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as 'this_week' | 'this_month' | 'all')}>
                <SelectTrigger className="w-full md:w-56 bg-black/30 border-vice-cyan/50 text-white min-h-[44px] rounded-lg justify-start">
                  <Filter className="w-4 h-4 mr-2 text-vice-cyan/80" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-vice-cyan/50 min-w-[14rem]">
                  <SelectItem value="this_week" className="text-white hover:bg-vice-cyan/20">This Week</SelectItem>
                  <SelectItem value="this_month" className="text-white hover:bg-vice-cyan/20">This Month</SelectItem>
                  <SelectItem value="all" className="text-white hover:bg-vice-cyan/20">All Forms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {/* Single expanded carousel card (matches Export sizing) */}
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
            <div className="my-2 sm:my-3 -mx-2 sm:mx-0 flex items-center justify-center">
              <div className="w-full max-w-5xl">
                <ViolationCarousel3D forms={filteredForms} heightClass="h-[260px] sm:h-[320px]" containerClassName="mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Books;
