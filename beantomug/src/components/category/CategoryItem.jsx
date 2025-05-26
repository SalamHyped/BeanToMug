import RoundedPhoto from "../roundedPhoto/RoundedPhoto";
import classes from './CategoryItem.module.css';
import {Link} from 'react-router-dom';
import { useState } from "react";
import Modal from "../modal/Modal";

import ItemModalHandler from "../ItemModalHandler/ItemModalHandler";
import axios from "axios";
 

export default function CategoryItem({items=[],category}) {
    
 const [selectedItem, setSelectedItem] = useState(null);
 const [loading, setLoading] = useState(false);
const [cartConfirmationOpen, setCartConfirmationOpen] = useState(false);
  const handleItemClick =async (e,item) => {
    e.preventDefault();
  setLoading(true);
  try {
    const res = await axios.get(`http://localhost:8801/menu/items/${item.item_id}`);
    
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
  return (
    <div className={classes.category_container}>

   { items.map((item) => (
      
    <div className={classes.item_wrapper} key={item.item_id}>
       <Link  onClick={(e) => handleItemClick(e, item)} >
      <RoundedPhoto
        src={item.item_photo_url}
        alt={item.item_name}
        size={150}
        borderWidth={3}
        borderColor="#ffffff"
      />
      <div className={classes.itemName}>{item.item_name}</div>
      <div className={classes.itemPrice}>{item.price} ₪</div>
      </Link>
    </div>
    ))}
   
    {selectedItem && (
        <ItemModalHandler
    
          item={selectedItem}
          category={category}
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