import classes from "./itemHandler.module.css";
import{useState,useContext,useEffect} from "react";
import { CartContext } from "../CartItems/CartContext";
import Modal from "../modal/Modal";
export default function ItemHandler({ item,onClose, onAddToCartComplete }) {
  if (!item) {
    return null;
  }
  const { item_name, item_photo_url, price} = item;
  const { addToCart} = useContext(CartContext);



  const[quantity, setQuantity] = useState(1);
   const [selectedOptions, setSelectedOptions] = useState({});


    useEffect(() => {
    if (item?.options) {
      const defaults = {};
      for (const key in item.options) {
        if (item.options[key].type === "checkbox") {
          defaults[key] = false;
        } else if (item.options[key].type === "select") {
          defaults[key] = item.options[key].values[0]; // default first option
        }
      }
      setSelectedOptions(defaults);
    }
  }, [item]);


  const handleAddToCart = () => {
     addToCart(item, quantity, selectedOptions);

       if (onAddToCartComplete) {
      onAddToCartComplete(); // Tell parent to close and show confirmation
    } else {
      onClose(); // fallback
    }
  
  };

   // Quantity controls
const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };


   // Calculate extra price from selected options
  const calculateOptionExtraPrice = () => {
    let extra = 0;
    if (!item?.options) return 0;

    for (const key in selectedOptions) {
      const value = selectedOptions[key];
      const option = item.options[key];
      if (!option) continue;

      const prices = option.prices || {};
      if (option.type === "select") {
        if (prices[value]) extra += prices[value];
      } else if (option.type === "checkbox") {
        if (value && prices["checked"]) extra += prices["checked"];
      }
    }
    return extra;
  };


  // Handlers to update options dynamically
   const handleSelectChange = (key, e) => {
    setSelectedOptions((prev) => ({ ...prev, [key]: e.target.value }));
  };
  const handleCheckboxChange = (key, e) => {
    setSelectedOptions((prev) => ({ ...prev, [key]: e.target.checked }));
  };



  // Render options dynamically based on item.options
  const renderOptions = () => {
   
    if (!item?.options) return null;
    return Object.entries(item.options).map(([key, option]) => {
      if (option.type === "select") {
        return (
          <fieldset key={key}>
            <legend>{option.label}</legend>
            <select
              value={selectedOptions[key] || ""}
              onChange={(e) => handleSelectChange(key, e)}
            >
              {option.values.map((val) => (
                <option key={val} value={val}>
                  {val} {option.prices && option.prices[val] ? `(+${option.prices[val]} ₪)` : ""}
                </option>
              ))}
            </select>
          </fieldset>
        );
      }
      if (option.type === "checkbox") {
        return (
          <fieldset key={key}>
            <legend>{option.label}</legend>
            <input
              type="checkbox"
              checked={selectedOptions[key] || false}
              onChange={(e) => handleCheckboxChange(key, e)}
            />
            {option.prices && option.prices["checked"] ? ` (+${option.prices["checked"]} ₪)` : ""}
          </fieldset>
        );
      }
      return null;
    });
  };
 
    
  

  return (
  <>


      <h2 className={classes.itemName}>{item_name}</h2>
      <div>
      <img src={item_photo_url} alt={item.item_name} />
      </div>
      <p>Price: {price} ₪</p>
 <div  className={classes.itemOptions}>
      {renderOptions()}
</div>
      <div className={classes.quantityControls}>
        <button onClick={decrementQuantity} disabled={quantity <= 1}>-</button>
        <span>{quantity}</span>
        <button  onClick={incrementQuantity}>+</button>
      </div>

      <button className={classes.addToCartBtn}onClick={handleAddToCart}>Add to Cart</button>
     
  
    </>
   
  );
}
