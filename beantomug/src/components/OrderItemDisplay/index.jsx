import React from 'react';
import styles from './orderItemDisplay.module.css';

/**
 * Reusable component for displaying order items
 * Eliminates duplication across OrderHistory, ReceiptOrders, and other components
 */
const OrderItemDisplay = ({ 
    items = [], 
    variant = 'default', // 'default', 'compact', 'detailed'
    showOptions = true,
    showPrice = true,
    showQuantity = true,
    className = ''
}) => {
    if (!items || items.length === 0) {
        return (
            <div className={`${styles.container} ${className}`}>
                <p className={styles.noItems}>No items found</p>
            </div>
        );
    }

    const formatOptions = (options) => {
        if (!options || Object.keys(options).length === 0) {
            return null;
        }

        return Object.entries(options)
            .filter(([_, opt]) => opt && opt.selected)
            .map(([_, opt]) => `${opt.label}: ${opt.value}`)
            .join(', ');
    };

    const formatIngredients = (ingredients) => {
        if (!ingredients || ingredients.length === 0) {
            return null;
        }

        return ingredients.map(ing => ing.ingredient_name).join(', ');
    };

    const renderItem = (item, index) => {
        const options = formatOptions(item.options);
        const ingredients = formatIngredients(item.ingredients);
        const customizations = options || ingredients;

        return (
            <div key={index} className={`${styles.item} ${styles[variant]}`}>
                <div className={styles.itemInfo}>
                    <h5 className={styles.itemName}>{item.item_name}</h5>
                    
                    {showOptions && customizations && (
                        <p className={styles.itemOptions}>
                            {customizations}
                        </p>
                    )}
                </div>
                
                {showQuantity && (
                    <div className={styles.itemQuantity}>
                        Qty: {item.quantity}
                    </div>
                )}
                
                {showPrice && (
                    <div className={styles.itemPrice}>
                        ${(item.price * item.quantity).toFixed(2)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`${styles.container} ${className}`}>
            <div className={styles.itemsList}>
                {variant === 'detailed' && (
                    <h4 className={styles.sectionTitle}>Order Items</h4>
                )}
                
                {items.map((item, index) => renderItem(item, index))}
            </div>
        </div>
    );
};

export default OrderItemDisplay; 