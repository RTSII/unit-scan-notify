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
  Home,
  Search,
  Filter,
  Image as ImageIcon
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

const FormsDirectory = () => {
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompletedForms();
  }, [user]);

  const fetchCompletedForms = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('violation_forms')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('date', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: "Failed to load completed forms",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-8 w-8 animate-pulse text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading forms directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-vice-cyan/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-vice-pink" />
            <h1 className="text-2xl font-bold vice-block-letters text-white">Forms Directory</h1>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/')}
          variant="outline" 
          size="sm" 
          className="bg-black/30 border-vice-cyan/50 text-white hover:bg-vice-cyan/20"
        >
          <Home className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6 max-w-6xl mx-auto">
        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vice-cyan" />
            <Input
              placeholder="Search completed forms..."
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

        {/* Forms Directory */}
        {filteredForms.length === 0 ? (
          <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-vice-cyan mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-white mb-2">
                {forms.length === 0 ? 'No Completed Forms' : 'No Forms Match Your Search'}
              </h3>
              <p className="text-vice-cyan/70">
                {forms.length === 0 
                  ? 'Complete and submit forms to see them in the directory.'
                  : 'Try adjusting your search terms to find specific forms.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              {searchTerm ? `Search Results (${filteredForms.length})` : `Completed Forms (${filteredForms.length})`}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Completed
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
                    {/* Violation Type */}
                    <div>
                      <p className="text-xs font-medium text-vice-cyan mb-1">Violation Type(s)</p>
                      <p className="text-sm text-white bg-black/30 rounded px-2 py-1">
                        {form.description}
                      </p>
                    </div>
                    
                    {/* Photo Thumbnails */}
                    {form.photos.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-vice-cyan mb-2">
                          Photos ({form.photos.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {form.photos.slice(0, 3).map((photo, index) => (
                            <div 
                              key={index}
                              className="aspect-square bg-black/30 rounded border border-vice-cyan/20 overflow-hidden relative group cursor-pointer"
                            >
                              <img 
                                src={photo} 
                                alt={`Violation photo ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const iconDiv = document.createElement('div');
                                    iconDiv.className = 'w-full h-full flex items-center justify-center';
                                    iconDiv.innerHTML = '<svg class="w-6 h-6 text-vice-cyan/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                    parent.appendChild(iconDiv);
                                  }
                                }}
                              />
                              {form.photos.length > 3 && index === 2 && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <span className="text-white font-medium">
                                    +{form.photos.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {form.photos.length === 0 && (
                      <div className="flex items-center gap-2 text-vice-cyan/50 text-sm">
                        <ImageIcon className="w-4 h-4" />
                        <span>No photos attached</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormsDirectory;