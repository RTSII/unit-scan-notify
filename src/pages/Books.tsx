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
  ArrowLeft,
  Search,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

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

  const filteredForms = forms.filter(form =>
    form.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigate('/')}
            variant="outline" 
            size="sm" 
            className="bg-black/30 border-vice-cyan/50 text-white hover:bg-vice-cyan/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-vice-pink" />
            <h1 className="text-2xl font-bold vice-block-letters text-white">Books</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-6xl mx-auto">
        {/* Search and Filter */}
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
          <Button variant="outline" className="bg-black/30 border-vice-cyan/50 text-white hover:bg-vice-cyan/20">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-vice-cyan">Total Forms</p>
                  <p className="text-2xl font-bold text-white">{forms.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-vice-pink" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-vice-cyan">This Month</p>
                  <p className="text-2xl font-bold text-white">
                    {forms.filter(form => 
                      new Date(form.created_at).getMonth() === new Date().getMonth()
                    ).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-vice-pink" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-vice-cyan">Recent</p>
                  <p className="text-2xl font-bold text-white">
                    {forms.filter(form => 
                      new Date().getTime() - new Date(form.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
                    ).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-vice-pink" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forms List */}
        {filteredForms.length === 0 ? (
          <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-vice-cyan mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-white mb-2">
                {forms.length === 0 ? 'No Forms Saved Yet' : 'No Forms Match Your Search'}
              </h3>
              <p className="text-vice-cyan/70">
                {forms.length === 0 
                  ? 'Complete forms and save them from the Export tab to see them here.'
                  : 'Try adjusting your search terms to find specific forms.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              {searchTerm ? `Search Results (${filteredForms.length})` : 'All Forms'}
            </h3>
            
            {filteredForms.map((form) => (
              <Card 
                key={form.id} 
                className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm hover:border-vice-pink/50 transition-all duration-200 cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                        Unit {form.unit_number}
                        <Badge className="bg-vice-pink/20 text-vice-pink border-vice-pink/30">
                          Saved
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-vice-cyan/80 mt-1">
                        {form.description}
                      </p>
                    </div>
                    
                    <div className="text-xs text-vice-cyan/60">
                      Saved {formatDate(form.created_at)}
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

export default Books;