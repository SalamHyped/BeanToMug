import classes from './CategoryItem.module.css';

import {Link} from 'react-router-dom'; 
import RoundedPhoto from "../roundedPhoto/RoundedPhoto";
export default function Category({items=[]}) {



    return (
       <div className={classes.category_container}>
         {items.map((item) => (
      <div className={classes.item_wrapper} key={item.category_id}>
       <Link  to={`/menu/${item.category_name}`}>
        <RoundedPhoto src={item.category_photo_url} alt={item.category_name} size={150} borderWidth={3} borderColor="#ffffff" />
        <div className={classes.itemName}>
         {item.category_name}
          </div>
           
      </Link>
      </div>
         ))}
      </div>
  
  )
}
      
