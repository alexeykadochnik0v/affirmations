import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function RequireAdmin({ children }) {
  const { user, role, roleLoaded, isModerator, loading } = useAuth();
  const loc = useLocation();
  // Wait while auth is loading or role is not determined yet
  if (loading) return null;
  if (user && !roleLoaded) return null;
  if (!user || !isModerator) return <Navigate to="/auth" replace state={{ from: loc }} />;
  return children;
}
