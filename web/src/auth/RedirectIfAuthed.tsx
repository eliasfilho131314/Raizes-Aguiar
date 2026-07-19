import { Navigate, Outlet } from 'react-router';
import { useAuth } from './AuthContext';

export function RedirectIfAuthed() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
