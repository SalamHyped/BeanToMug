import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import classes from './categoryItem.module.css';
import RoundedPhoto from '../roundedPhoto/RoundedPhoto';
import Modal from "../modal/Modal";
import ItemHandler from "../ItemHandler/ItemHandler";

import { getApiConfig } from "../../utils/config";

export default function CategoryItem({items=[], category}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cartConfirmationOpen, setCartConfirmationOpen] = useState(false);

  const handleItemClick = async (e, item) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(`/menu/items/${item.item_id}`, getApiConfig());
      setSelectedItem(res.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCartComplete = () => {
    setSelectedItem(null); // close item modal
    setCartConfirmationOpen(true); // open confirmation
  };

  // Helper function to get the display price (VAT-inclusive if available, fallback to base price)
  const getDisplayPrice = (item) => {
    // Prefer VAT-inclusive price for customer transparency
    if (item.priceWithVAT !== undefined && item.priceWithVAT !== null) {
      return item.priceWithVAT;
    }
    // Fallback to base price if VAT calculation not available
    return item.price;
  };

  // Helper function to format price with currency symbol
  const formatPrice = (price) => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return '0 ₪';
    return `${numericPrice.toFixed(2)} ₪`;
  };

  return (
    <div className={classes.category_container}>
      {items.map((item) => (
        <div className={classes.item_wrapper} key={item.item_id}>
          <Link onClick={(e) => handleItemClick(e, item)}>
            <RoundedPhoto
              src={item.item_photo_url}
              alt={item.item_name}
              size={150}
              borderWidth={3}
              borderColor="#ffffff"
            />
            <div className={classes.itemName}>{item.item_name}</div>
            <div className={classes.itemPrice}>
              {formatPrice(getDisplayPrice(item))}
              {/* Show VAT indicator if VAT-inclusive price is available */}
             
            </div>
          </Link>
        </div>
      ))}
   
      {selectedItem && (
        <ItemHandler
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCartComplete={handleAddToCartComplete}
        />
      )}

      {cartConfirmationOpen && (
        <Modal
          isOpen={cartConfirmationOpen}
          onClose={() => setCartConfirmationOpen(false)}
          title="Added to Cart"
          footerButtons={[
            {
              label: "Close",
              onClick: () => setCartConfirmationOpen(false),
              className: "bg-green-500 text-white px-4 py-2 rounded",
            },
          ]}
        >
          <p>Your item was added to the cart successfully!</p>
        </Modal>
      )}
    </div>
  );
}