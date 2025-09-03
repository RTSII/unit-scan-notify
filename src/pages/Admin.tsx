import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import AdminInvites from "@/components/AdminInvites";

const Admin = () => {
  const { user, loading, profile } = useAuth();

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if not admin
  if (!loading && user && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center pb-safe-bottom">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-vice-purple via-black to-vice-blue pb-safe-bottom overflow-auto">
      <div className="p-4 pb-12 mb-safe-bottom">
        <AdminInvites />
      </div>
    </div>
  );
};

export default Admin;