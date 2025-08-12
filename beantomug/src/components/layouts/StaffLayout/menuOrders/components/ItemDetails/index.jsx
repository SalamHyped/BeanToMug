import React from 'react';

/**
 * ItemDetails component for displaying item ingredients
 * Renders ingredient tags for an order item
 */
const ItemDetails = ({ item, classes }) => {
  if (!item.ingredients || item.ingredients.length === 0) {
    return null;
  }
  
  return (
    <div className={classes.itemIngredients}>
      {item.ingredients.map((ingredient, index) => (
        <span key={index} className={classes.ingredientTag}>
          {ingredient.ingredient_name}
        </span>
      ))}
    </div>
  );
};

export default ItemDetails;
