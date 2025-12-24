import classes from './CategoryItem.module.css';

import {Link} from 'react-router-dom'; 
import RoundedPhoto from "../roundedPhoto/RoundedPhoto";

export default function Category({items=[]}) {
  // Function to clean display name by removing cascade characters
  const getDisplayName = (categoryName) => {
    if (!categoryName) return '';
    // Remove dash characters and trim whitespace
    return categoryName.replace(/-/g, ' ').trim();
  };

  return (
     <div className={classes.category_container}>
       {items.map((item) => (
         <div className={classes.item_wrapper} key={item.category_id}>
           <Link to={`/menu/${item.category_name}`}>
             <RoundedPhoto 
               src={item.category_photo_url} 
               alt={getDisplayName(item.category_name)} 
               size={150} 
               borderWidth={3} 
               borderColor="#ffffff" 
             />
             <div className={classes.itemName}>
              {getDisplayName(item.category_name)}
               </div>
               
           </Link>
         </div>
       ))}
      </div>
  )
}
      
