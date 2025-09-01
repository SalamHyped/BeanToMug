import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Menu from '../pages/Menu';
import CartPage from '../pages/CartPage';
import LogIn from '../pages/LogIn';
import EmailVerification from './auth/EmailVerification';
import ResendVerification from './auth/ResendVerification';
import VerificationPending from './auth/VerificationPending';
import ResetPassword from '../pages/ResetPassword';
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
import CustomerLayout from './layouts/CustomerLayout';

// Only page content is lazy-loaded
const Dashboard = lazy(() => import('../pages/staff/DashBoard'));
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const TaskDashboard = lazy(() => import('../pages/staff/TaskDashboard'));
const Receipts = lazy(() => import('../pages/staff/Receipts'));
const CustomerReceipts = lazy(() => import('../pages/customer/CustomerReceipts'));
const PublicGallery = lazy(() => import('../pages/Gallery'));
const StaffGallery = lazy(() => import('../pages/staff/StaffGallery'));
const AdminInventory = lazy(() => import('../pages/admin/Inventory'));
const StaffSchedulePage = lazy(() => import('../pages/staff/StaffSchedulePage'));

// Import the existing order queue for admin use
const MenuOrdersContainer = lazy(() => import('./layouts/StaffLayout/menuOrders/MenuOrdersContainer'));
// Import Users Management component
const UsersManagement = lazy(() => import('../pages/admin/UsersManagement/index'));
// Import Menu Management component
const MenuManagement = lazy(() => import('../pages/admin/MenuManagement/index'));
// Import Ingredient Management component
const IngredientManagement = lazy(() => import('../pages/admin/IngredientManagement'));
// Import Ingredient Types Management component
const IngredientTypesManagement = lazy(() => import('../pages/admin/IngredientTypesManagement'));
// Import Ingredient Categories Management component
const IngredientCategoriesManagement = lazy(() => import('../pages/admin/IngredientCategoriesManagement'));
// Import Ingredient Effects Management component
const IngredientEffectsManagement = lazy(() => import('../pages/admin/IngredientEffectsManagement'));
// Import Configuration Dashboard component
const ConfigurationDashboard = lazy(() => import('../pages/admin/ConfigurationDashboard'));
// Import Work Schedule Management component
const WorkScheduleManagement = lazy(() => import('../pages/admin/WorkScheduleManagement/index'));
// Import Supplier Management component
const SupplierManagement = lazy(() => import('../pages/admin/SupplierManagement/index'));
// Import Product Order Management component
const ProductOrderManagement = lazy(() => import('../pages/admin/ProductOrderManagement/index'));

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
            <Route path="/reset-password" element={<ResetPassword/>} />
            <Route path="/profile-completion" element={<ProfileCompletion/>} />
            <Route path="/cart" element={<CartPage/>} />
            <Route path="/gallery" element={<PublicGallery/>} />
            <Route path="/payment-success" element={<PaymentSuccess/>} />
            <Route path="/payment-cancel" element={<PaymentCancel/>} />
            
            {/* Customer protected routes */}
            <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']} />}>
                <Route element={<CustomerLayout />}>
                    <Route index element={<Menu />} />
                    <Route path="orders" element={<OrderHistory />} />
                    <Route path="receipts" element={
                      <Suspense fallback={<PageLoader />}>
                        <CustomerReceipts />
                      </Suspense>
                    } />
                    <Route path="profile" element={<Profile />} />
                </Route>
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
                    <Route path="orders/queue" element={
                      <Suspense fallback={<PageLoader />}>
                        <MenuOrdersContainer />
                      </Suspense>
                    } />
                    <Route path="users" element={
                      <Suspense fallback={<PageLoader />}>
                        <UsersManagement />
                      </Suspense>
                    } />
                    <Route path="menuManagement/menuSettings" element={
                      <Suspense fallback={<PageLoader />}>
                        <MenuManagement />
                      </Suspense>
                    } />
                    <Route path="menuManagement/ingredients" element={
                      <Suspense fallback={<PageLoader />}>
                        <IngredientManagement />
                      </Suspense>
                    } />
                    <Route path="menuManagement/configuration" element={
                      <Suspense fallback={<PageLoader />}>
                        <ConfigurationDashboard />
                      </Suspense>
                    } />
                    <Route path="menuManagement/ingredient-types" element={
                      <Suspense fallback={<PageLoader />}>
                        <IngredientTypesManagement />
                      </Suspense>
                    } />
                    <Route path="menuManagement/ingredient-categories" element={
                      <Suspense fallback={<PageLoader />}>
                        <IngredientCategoriesManagement />
                      </Suspense>
                    } />
                    <Route path="menuManagement/ingredient-effects" element={
                      <Suspense fallback={<PageLoader />}>
                        <IngredientEffectsManagement />
                      </Suspense>
                    } />
                    <Route path="gallery" element={
                      <Suspense fallback={<PageLoader />}>
                        <StaffGallery />
                      </Suspense>
                    } />
                    <Route path="inventory" element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminInventory />
                      </Suspense>
                    } />
                    <Route path="work-schedule" element={
                      <Suspense fallback={<PageLoader />}>
                        <WorkScheduleManagement />
                      </Suspense>
                    } />
                    <Route path="suppliers" element={
                      <Suspense fallback={<PageLoader />}>
                        <SupplierManagement />
                      </Suspense>
                    } />
                    <Route path="product-orders" element={
                      <Suspense fallback={<PageLoader />}>
                        <ProductOrderManagement />
                      </Suspense>
                    } />
                    <Route path="profile" element={<Profile />} />
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
                    <Route path="schedule" element={
                      <Suspense fallback={<PageLoader />}>
                        <StaffSchedulePage />
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
                    <Route path="receipts" element={
                      <Suspense fallback={<PageLoader />}>
                        <Receipts />
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
                    <Route path="profile" element={<Profile />} />
                </Route>
            </Route>
        </Routes>
        <Footer />
        </>
    );
}