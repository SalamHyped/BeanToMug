import { BrowserRouter } from "react-router-dom";
import { useEffect, useContext } from 'react';

import classes from './app.module.css';
import React from 'react';
import './index.css'; // Import the main CSS file with Tailwind

import {CartProvider} from "./components/CartItems/CartContext"
import MyRoutes from "./components/MyRoutes";
import { UserProvider, UserContext } from './context/UserContext/UserProvider';
import NotificationToast from './components/controls/NotificationToast';
import socketService from './services/socketService';

// WebSocket initialization component
const WebSocketInitializer = () => {
  const { user } = useContext(UserContext);

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        console.log('WebSocketInitializer: Initializing socket connection');
        await socketService.connect();
        
        // Authenticate user if logged in
        if (user && user.id) {
          console.log('WebSocketInitializer: Authenticating user:', user);
          socketService.authenticate({
            userId: user.id,
            userRole: user.role || 'customer'
          });
        } else {
          console.log('WebSocketInitializer: No user to authenticate');
        }
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      console.log('WebSocketInitializer: Disconnecting socket');
      socketService.disconnect();
    };
  }, [user]);

  // Separate effect to handle user authentication when user changes
  useEffect(() => {
    if (user && user.id && socketService.isConnected) {
      console.log('WebSocketInitializer: User changed, re-authenticating:', user);
      socketService.authenticate({
        userId: user.id,
        userRole: user.role || 'customer'
      });
    }
  }, [user, socketService.isConnected]);

  return null;
};

export default function App() {
  return (
    <UserProvider>
      <CartProvider>
        <div className={classes.app}>
          <BrowserRouter>
            <WebSocketInitializer />
            <MyRoutes />
            <NotificationToast />
          </BrowserRouter>
        </div>
      </CartProvider>
    </UserProvider>
  );
}


