import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../../../context/UserContext/UserContext';
import Sidebar from '../../layouts/Sidebar';
import styles from './protectedRoute.module.css';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useUser();

  // Wait for auth check
  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user's role not allowed, redirect to home
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Render protected content
  return (
    <div className={styles.layout}>
      <Sidebar user={user} />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedRoute; 