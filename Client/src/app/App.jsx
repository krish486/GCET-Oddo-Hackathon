import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../features/auth/state/authContext';
import { LoadingState } from '../shared/components/States';

export function ProtectedRoute() { const { user } = useAuth(); const location = useLocation(); if (!user) return <Navigate to="/login" replace state={{ from: location }} />; return <Outlet />; }
export function PublicRoute() { const { user } = useAuth(); return user ? <Navigate to="/dashboard" replace /> : <Outlet />; }
export function RouteFallback() { return <div className="center-page"><LoadingState label="This page could not be found." /></div>; }
