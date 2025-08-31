import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Books from "./pages/Books";
import FormsDirectory from "./pages/FormsDirectory";
import Capture from "./pages/Capture";
import DetailsPrevious from "./pages/DetailsPrevious";
import DetailsLive from "./pages/DetailsLive";
import Export from "./pages/Export";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/details-previous" element={<DetailsPrevious />} />
            <Route path="/details-live" element={<DetailsLive />} />
            <Route path="/export" element={<Export />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/books" element={<Books />} />
            <Route path="/forms-directory" element={<FormsDirectory />} />
            <Route path="/auth" element={<Auth />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
