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
  const [categoryItems, setCategoryItems] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { category } = useParams();
  
  const selectedCategory = category || '';

  // Fetch categories regardless of selected category
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:8801/menu', {
          withCredentials: true
        });
        setCategoryItems(res.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      }
    };

    fetchCategories();
  }, []); // Only run once when component mounts

  // Fetch dishes when category changes
  useEffect(() => {
    const fetchDishes = async () => {
      setLoading(true);
      try {
        if (selectedCategory) {
          const res = await axios.get(`http://localhost:8801/menu/${selectedCategory}`);
          setDishes(res.data);
        } else {
          setDishes([]); // Clear dishes when no category selected
        }
      } catch (err) {
        console.error('Error fetching dishes:', err);
        setError('Failed to load dishes');
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, [selectedCategory]);

  if (error) {
    return <div className={classes.error}>Error: {error}</div>;
  }

  return (
    <CenteredLayout>
      <div className={classes.menuWrapper}>
        <div className={classes.sidebar}>
          <h2>Category</h2>
          <nav>
            <ul>
              {categoryItems.map((item) => (
                <li key={item.category_id}>
                  <Link 
                    to={`/menu/${item.category_name}`} 
                    className={classes.categoryItem}
                  >
                    {item.category_name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={classes.menu}>
          <h2>Menu</h2>
          {loading ? (
            <div className={classes.loading}>Loading...</div>
          ) : (
            selectedCategory === '' ? (
              <Category items={categoryItems}/>
            ) : (
              <CategoryItem category={selectedCategory} items={dishes}/>
            )
          )}
        </div>
      </div>
    </CenteredLayout>
  );
}