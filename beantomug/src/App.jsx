import { BrowserRouter } from "react-router-dom";

import classes from './app.module.css';
import React from 'react';

import {CartProvider} from "./components/CartItems/CartContext"
import MyRoutes from "./components/MyRoutes";
import { UserProvider } from './context/UserContext/UserProvider';


export default function App() {
  return (
    <UserProvider>
      <CartProvider>
        <div className={classes.app}>
          <BrowserRouter>
             <MyRoutes />
         
          </BrowserRouter>
      
        </div>
      </CartProvider>
    </UserProvider>
  );
}


