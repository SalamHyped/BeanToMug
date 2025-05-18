import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Menu from '../pages/Menu';
import CartPage from '../pages/CartPage';
export default function MyRoutes(){
    return(
        
         <Routes>
                <Route path="/" element={<Menu />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/menu/:category" element={<Menu />} />
                <Route path="/cart" element={<CartPage />} />

             
               
            </Routes>
          

    );
}