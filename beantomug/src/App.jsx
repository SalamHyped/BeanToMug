import { BrowserRouter } from "react-router-dom";
import { useEffect, useContext } from 'react';

import classes from './app.module.css';
import React from 'react';

import {CartProvider} from "./components/CartItems/CartContext"
import MyRoutes from "./components/MyRoutes";
import { UserProvider, UserContext } from './context/UserContext/UserProvider';
import NotificationToast from './components/controls/NotificationToast';
import socketService from './services/socketService';

// WebSocket initialization component
const WebSocketInitializer = () => {
  const { user } = useContext(UserContext);

  useEffect(() => {
    // Initialize WebSocket connection
    socketService.connect();

    // Authenticate user if logged in
    if (user && user.id) {
      socketService.authenticate({
        userId: user.id,
        userRole: user.role || 'customer'
      });
    } 

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
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


