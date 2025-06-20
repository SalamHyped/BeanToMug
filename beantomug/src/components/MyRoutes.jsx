import React from 'react';
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
import ProtectedRoute from './auth/ProtectedRoute';
import Dashboard from '../pages/staff/DashBoard';
import Header from '../components/header/Header'
import Home from '../pages/home/Home'
import OrderHistory from '../pages/OrderHistory';
import Footer from './footer/Footer';

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
            <Route path="/cart" element={<CartPage/>} />
            <Route path="/payment-success" element={<PaymentSuccess/>} />
            <Route path="/payment-cancel" element={<PaymentCancel/>} />
            
            {/* Customer protected routes */}
            <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']} />}>
                <Route index element={<Menu />} />
                <Route path="orders" element={<OrderHistory />} />
            </Route>

            {/* Admin protected routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
                
         
            </Route>

            {/* Staff protected routes */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}/>    }>
                 <Route path="" element={< Dashboard/>} />
              
            </Route>
        </Routes>
        <Footer />
        </>
    );
}