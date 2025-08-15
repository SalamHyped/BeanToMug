import React, {useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from "../components/forms/LogInForm";  
import CenteredLayout from "../components/CenteredLayout";
import axios from 'axios';
import classes from './login.module.css';
import { IoAlertCircleOutline } from "react-icons/io5";
import { useUser } from '../context/UserContext/UserContext';
import { CartContext } from '../components/CartItems/CartContext';
import { getApiConfig } from '../utils/config';

export default function LogIn() {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const { refreshCart } = useContext(CartContext);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clear error and success messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [error]);
  
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleLoginSuccess = async (formData) => {
    try {
      // Make API call to your backend login endpoint
      const response = await axios.post('/auth/login', formData, getApiConfig());

      if (response.data.success) {
        // Update user context with the user data
        setUser(response.data.user);
        setSuccess('Login successful!');
        // Refresh cart after login
        if (refreshCart) await refreshCart();
        // Redirect to home page after successful login
         const role = response.data.user.role;
        
      let path = '/';
      if (role === 'staff') path = '/staff';
      else if (role === 'admin') path = '/admin';
      else if (role === 'customer') path = '/customer';
        setTimeout(() => navigate(path), 1000);
        console.log('Login response:', response.data);
        return response.data;
      } else {
        setError('Invalid credentials');
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      throw err;
    }
  };
  
  const handleSignupSuccess = (userData) => {
    setSuccess('Account created successfully! Please check your email to verify your account.');
    // Redirect to email verification pending page after short delay
    setTimeout(() => navigate('/verify-email/pending', { 
      state: { email: userData.email }
    }), 2000);
  };

  return (
    <CenteredLayout>
      <div>
        {error && (
          <div className={classes.errorMessage}>
            <IoAlertCircleOutline style={{ marginRight: '8px', fontSize: '1.2em' }} />
            {error}
          </div>
        )}
        
        {success && (
          <div className={classes.successMessage}>
            {success}
          </div>
        )}
        
        <LoginForm 
          onLoginSuccess={handleLoginSuccess} 
          onSignupSuccess={handleSignupSuccess} 
        />
      </div>
    </CenteredLayout>
  );
}