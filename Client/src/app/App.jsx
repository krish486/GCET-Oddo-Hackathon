import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../features/auth/state/authContext';
import { LoadingState } from '../shared/components/States';

export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return <div className="center-page"><LoadingState label="Restoring your session…" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function PublicRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return <div className="center-page"><LoadingState label="Loading…" /></div>;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export function RouteFallback() {
  return <div className="center-page"><LoadingState label="This page could not be found." /></div>;
}
