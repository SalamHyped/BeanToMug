import React from 'react';
import classes from './menu.module.css';
import Category from '../components/category/Category';
import{Link} from 'react-router-dom';
import CenteredLayout from '../components/CenteredLayout';  
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import CategoryItem from '../components/category/CategoryItem';

  
export default function Menu() {
const[categoryItems,setCategoryItems]=useState([]);
const[dishes,setDishes]=useState([]);
  const { category } = useParams();
  
  const selectedCategory = category || ''
useEffect(() => {
  const fetchData = () => {
    try {
      if (selectedCategory === '') {
        // Load categories
        axios.get('http://localhost:8801/menu', {
  withCredentials: true // Send cookies with the request
}).then((res) => {
          setCategoryItems(res.data); // Set categories
          console.log(res.data); // Data from API

        });  
        
       
        // Clear dishes if no category is selected
        setDishes([]); // Clear dishes
      } else {
        // Load dishes for selected category
        axios.get(`http://localhost:8801/menu/${selectedCategory}`).then((res) => {
          setDishes(res.data); // Set dishes
          console.log(res.data); // Data from API
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  fetchData();
}, [selectedCategory]);

  return (
    <CenteredLayout>
    <div className={classes.menuWrapper} >
      <div className={classes.sidebar }>
        <h2>Category</h2>
        <nav>
        <ul>
         { categoryItems.map((item) => (
            <li key={item.category_id}>
              <Link to={`/menu/${item.category_name}`} className={classes.categoryItem}>
                {item.category_name}
              </Link>
            </li>
          ))}
         
      
          </ul>
        </nav>
      

      </div>
    <div className={classes.menu}>
      <h2>Menu</h2>
      {selectedCategory === '' ? <Category items={categoryItems}/>:
      <CategoryItem category={selectedCategory}items={dishes}/>}
      
     </div>
    </div>
    </CenteredLayout>
  );
}