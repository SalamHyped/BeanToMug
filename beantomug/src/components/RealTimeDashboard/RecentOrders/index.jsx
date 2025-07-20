import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './recentOrders.module.css';

const RecentOrders = ({ orders = [] }) => {
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [showNewOrderIndicator, setShowNewOrderIndicator] = useState(false);
    const listRef = useRef(null);
    const prevOrdersLengthRef = useRef(orders.length);
    const debounceTimerRef = useRef(null);
    const isScrollingRef = useRef(false);

    // Debounced scroll function
    const debouncedScrollToTop = useCallback(() => {
        if (listRef.current && !isScrollingRef.current) {
            isScrollingRef.current = true;
            setShowNewOrderIndicator(true);
            
            listRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Reset scrolling flag after animation completes
            setTimeout(() => {
                isScrollingRef.current = false;
            }, 1000);
            
            // Hide indicator after 3 seconds
            setTimeout(() => {
                setShowNewOrderIndicator(false);
            }, 3000);
        }
    }, []);

    // Auto-scroll to top when new orders are added (with debouncing)
    useEffect(() => {
        if (orders.length > prevOrdersLengthRef.current) {
            // Clear existing timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            
            // Set new timer (300ms debounce)
            debounceTimerRef.current = setTimeout(() => {
                debouncedScrollToTop();
            }, 300);
        }
        prevOrdersLengthRef.current = orders.length;
    }, [orders.length, debouncedScrollToTop]);

    // Auto-scroll to bottom when component first loads with orders
    useEffect(() => {
        if (orders.length > 0 && listRef.current) {
            // Scroll to bottom initially to show most recent orders (slower timing)
            setTimeout(() => {
                if (listRef.current) {
                    listRef.current.scrollTo({
                        top: listRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 500); // Delay initial scroll
        }
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const toggleOrderItems = (orderId) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    return (
        <div className={styles.section}>
            <div className={styles.headerContainer}>
                <h3>🛒 Recent Orders</h3>
                {showNewOrderIndicator && (
                    <div className={styles.newOrderIndicator}>
                        <span className={styles.indicatorText}>New Order!</span>
                        <span className={styles.indicatorDot}>●</span>
                    </div>
                )}
            </div>
            <div className={styles.list} ref={listRef}>
                {orders.length === 0 ? (
                    <p className={styles.empty}>No recent orders</p>
                ) : (
                    orders.map((order, index) => {
                        const orderId = order.order_id || order.orderId;
                        const isExpanded = expandedOrders.has(orderId);
                        const hasItems = order.items && Array.isArray(order.items) && order.items.length > 0;
                        
                        return (
                            <div key={index} className={styles.item}>
                                <div className={styles.itemHeader}>
                                    <span className={styles.id}>#{orderId}</span>
                                    <span className={`${styles.status} ${styles[order.status]}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className={styles.itemDetails}>
                                    <span>{order.order_type || order.orderType}</span>
                                    <span className={styles.time}>
                                        {new Date(order.created_at || order.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                
                                {/* Order items dropdown */}
                                {hasItems && (
                                    <div className={styles.orderItemsContainer}>
                                        <button 
                                            className={styles.toggleButton}
                                            onClick={() => toggleOrderItems(orderId)}
                                        >
                                            <span className={styles.toggleText}>
                                                {isExpanded ? 'Hide Items' : `Show Items (${order.items.length})`}
                                            </span>
                                            <span className={`${styles.toggleIcon} ${isExpanded ? styles.expanded : ''}`}>
                                                ▼
                                            </span>
                                        </button>
                                        
                                        {isExpanded && (
                                            <div className={styles.orderItems}>
                                                <div className={styles.itemsList}>
                                                    {order.items.map((item, itemIndex) => (
                                                        <div key={itemIndex} className={styles.orderItem}>
                                                            <span className={styles.itemName}>
                                                                {item.item_name} x{item.quantity}
                                                            </span>
                                                            {item.ingredients && item.ingredients.length > 0 && (
                                                                <div className={styles.ingredients}>
                                                                    {item.ingredients.map((ingredient, ingIndex) => (
                                                                        <span key={ingIndex} className={styles.ingredient}>
                                                                            {ingredient.ingredient_name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RecentOrders; 