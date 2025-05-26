import classes from "./itemModalHandler.module.css";
import ItemHandler from "../ItemHandler/ItemHandler";
import { useEffect,useState } from "react";
import Modal from "../modal/Modal";

export default function ItemModalHandler({ item, onClose, onAddToCartComplete  }) {
  
  if (!item) {
    return null;
  }


    useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

    const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose(); // only close if clicking directly on the overlay
    }
  };

  return (
    <div className={`${classes.modal_overlay} ${item ? classes.active : ""}`} onClick={handleOverlayClick}>
          <div className={classes.modal_content}>
       <ItemHandler item={item}   onAddToCartComplete={onAddToCartComplete} />
      <button className={classes.modalBtnCloser} onClick={onClose}>Close</button>
      </div>
    
      </div>
    
  );
}