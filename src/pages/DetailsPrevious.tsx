import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader2, Home } from "lucide-react";
import DetailsPrevious from "../components/DetailsPrevious";

const DetailsPreviousPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return <DetailsPrevious />;
};

export default DetailsPreviousPage;