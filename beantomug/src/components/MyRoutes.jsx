import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Menu from '../pages/Menu';
import CartPage from '../pages/CartPage';
import LogIn from '../pages/LogIn';
import EmailVerification from './auth/EmailVerification';
import ResendVerification from './auth/ResendVerification';
import VerificationPending from './auth/VerificationPending';
import PaymentSuccess from '../pages/PaymentSuccess';
import PaymentCancel from '../pages/PaymentCancel';
import ProfileCompletion from '../pages/ProfileCompletion';
import ProtectedRoute from './auth/ProtectedRoute';
import Header from '../components/header/Header'
import Home from '../pages/home/Home'
import OrderHistory from '../pages/OrderHistory';
import Profile from '../pages/customer/Profile';
import Gallery from '../pages/Gallery';
import Footer from './footer/Footer';

// Layouts load immediately (no lazy loading for better UX)
import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';

// Only page content is lazy-loaded
const Dashboard = lazy(() => import('../pages/staff/DashBoard'));
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const TaskDashboard = lazy(() => import('../pages/staff/TaskDashboard'));
const PublicGallery = lazy(() => import('../pages/Gallery'));
const StaffGallery = lazy(() => import('../pages/staff/StaffGallery'));

// Loading component for page content only
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    fontSize: '1rem',
    color: '#666'
  }}>
    Loading Page...
  </div>
);

export default function MyRoutes(){
    const location = useLocation();
    const hideHeader = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff');

    return(
        <> 
             {!hideHeader && <Header />}
        <Routes>
       
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/menu/:category" element={<Menu />} />
            <Route path="/login" element={<LogIn/>} />
            <Route path="/verify-email" element={<EmailVerification/>} />
            <Route path="/verify-email/pending" element={<VerificationPending/>} />
            <Route path="/resend-verification" element={<ResendVerification/>} />
            <Route path="/profile-completion" element={<ProfileCompletion/>} />
            <Route path="/cart" element={<CartPage/>} />
            <Route path="/gallery" element={<PublicGallery/>} />
            <Route path="/payment-success" element={<PaymentSuccess/>} />
            <Route path="/payment-cancel" element={<PaymentCancel/>} />
            
            {/* Customer protected routes */}
            <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']} />}>
                <Route index element={<Menu />} />
                <Route path="orders" element={<OrderHistory />} />
                <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin protected routes - Layout loads immediately, only pages are lazy */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<AdminLayout />}>
                    <Route index element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminDashboard />
                      </Suspense>
                    } />
                    <Route path="tasks" element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminDashboard />
                      </Suspense>
                    } />
                    <Route path="orders" element={<div>Admin Orders</div>} />
                    <Route path="users" element={<div>Admin Users</div>} />
                    <Route path="menu" element={<div>Admin Menu Management</div>} />
                    <Route path="gallery" element={
                      <Suspense fallback={<PageLoader />}>
                        <StaffGallery />
                      </Suspense>
                    } />
                </Route>
            </Route>

            {/* Staff protected routes - Layout loads immediately, only pages are lazy */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']} />}>
                <Route element={<StaffLayout />}>
                    <Route index element={
                      <Suspense fallback={<PageLoader />}>
                        <Dashboard />
                      </Suspense>
                    } />
                    <Route path="tasks" element={
                      <Suspense fallback={<PageLoader />}>
                        <TaskDashboard />
                      </Suspense>
                    } />
                    <Route path="orders" element={
                      <Suspense fallback={<PageLoader />}>
                        <Dashboard />
                      </Suspense>
                    } />
                    <Route path="inventory" element={
                      <Suspense fallback={<PageLoader />}>
                        <Dashboard />
                      </Suspense>
                    } />
                    <Route path="gallery" element={
                      <Suspense fallback={<PageLoader />}>
                        <StaffGallery />
                      </Suspense>
                    } />
                </Route>
            </Route>
        </Routes>
        <Footer />
        </>
    );
}