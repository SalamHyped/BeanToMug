import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../../../context/UserContext/UserContext';
import classes from './protectedRoute.module.css';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useUser();
  const location = useLocation();
  
  // Check if the current route is a customer route
  const isCustomerRoute = location.pathname.startsWith('/customer');

  // Wait for auth check
  if (loading) {
    return <div className={classes.loading}>Loading...</div>;
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user's role not allowed, redirect to home
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Render the protected content (layout components will handle sidebar)
  return <Outlet />;
};

export default ProtectedRoute; 