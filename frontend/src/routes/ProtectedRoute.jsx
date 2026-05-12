import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Redirect to login if not authenticated
export const ProtectedRoute = () => {
  const { isAuthenticated, initialized } = useSelector((s) => s.auth);
  if (!initialized) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Loading...</p>
      </div>
    </div>
  );
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Redirect to dashboard if already authenticated
export const PublicRoute = () => {
  const { isAuthenticated, initialized } = useSelector((s) => s.auth);
  if (!initialized) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

// Role-based guard
export const RoleRoute = ({ allowedRoles }) => {
  const { user } = useSelector((s) => s.auth);
  return allowedRoles.includes(user?.role) ? <Outlet /> : <Navigate to="/dashboard" replace />;
};
