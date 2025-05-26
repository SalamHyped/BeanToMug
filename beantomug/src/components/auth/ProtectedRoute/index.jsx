import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../../../context/UserContext/UserContext';
import Sidebar from '../../layouts/Sidebar';
import styles from './protectedRoute.module.css';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useUser();

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user's role is not in the allowed roles, redirect to home
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // If user is authenticated and has the right role, render the layout with sidebar
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