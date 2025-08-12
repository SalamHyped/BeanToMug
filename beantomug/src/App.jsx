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
            await socketService.connect();

            // Authenticate user if logged in
            if (user && user.id) {
              const authSuccess = socketService.authenticate({
                userId: user.id,
                userRole: user.role || 'customer'
              });
            }
          } catch (error) {
            // Handle error silently
          }
        };

    initializeSocket();

            // Cleanup on unmount
        return () => {
          socketService.disconnect();
        };
  }, [user]);

          // Separate effect to handle user authentication when user changes
        useEffect(() => {
          if (user && user.id) {
            // Check connection status
            const connectionStatus = socketService.getConnectionStatus();

            if (connectionStatus.isConnected) {
              const authSuccess = socketService.authenticate({
                userId: user.id,
                userRole: user.role || 'customer'
              });
            }
          }
        }, [user]);

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


