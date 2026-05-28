import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Droplet } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Droplet className="w-10 h-10 text-primary animate-bounce" />
          <p className="text-muted-foreground text-sm tracking-widest uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  if (user === false) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
