import { BrowserRouter } from "react-router-dom";

import classes from './app.module.css';
import React from 'react';
import Header from "./components/header/Header";
import {CartProvider} from "./components/CartItems/CartContext"
import MyRoutes from "./components/MyRoutes";


export default function App() {
  return (
    <CartProvider>
    <div className={classes.app}>
      <BrowserRouter>
        <Header />
         <MyRoutes />
     
      </BrowserRouter>
  
    </div>
  </CartProvider>
  );
}


