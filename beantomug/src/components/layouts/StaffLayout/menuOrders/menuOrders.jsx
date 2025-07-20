import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import socketService from '../../../../services/socketService';
import ToggleSwitch from '../../../controls/ToggleSwitch';
import classes from './menuOrders.module.css';

const MenuOrders = () => {
 
    const [orders, setOrders] = useState([]);
    const [doneOrders, setDoneOrders] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(null);
    const [dragProgress, setDragProgress] = useState({}); // Track drag progress for each order
    const [showCompleted, setShowCompleted] = useState(false); // Toggle state for completed/processing orders

    // Fetch orders from backend with memoization
    const fetchOrders = useCallback(async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8801/orders/staff/all', {
          withCredentials: true
        });
        
        // Filter orders based on toggle state - only show processing or completed orders
        const filteredOrders = response.data.orders.filter(order => {
          if (showCompleted) {
            return order.status === 'completed';
          } else {
            return order.status === 'processing';
          }
        });
        
        setOrders(filteredOrders);
        setError(null);
        setLastFetchTime(new Date());
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    }, [showCompleted]);

    // Initial fetch
    useEffect(() => {
      fetchOrders();
    }, [fetchOrders]);

    // WebSocket event listeners for real-time updates
    useEffect(() => {
      // Handle new orders - use complete data from WebSocket
      const handleNewOrder = (orderData) => {
        console.log('New order received via WebSocket:', orderData);
        
        // Check if we have complete order data with items
        if (orderData.items && Array.isArray(orderData.items)) {
          // We have complete order data from WebSocket - use it directly
          console.log('Using complete order data from WebSocket:', orderData);
          
          // Only add if it matches current filter
          if ((showCompleted && orderData.status === 'completed') || 
              (!showCompleted && orderData.status === 'processing')) {
            setOrders(prev => [orderData, ...prev]);
          }
        } else {
          // Basic notification - fetch complete data from API
          console.log('Fetching complete order data from API for order:', orderData.orderId);
          axios.get('http://localhost:8801/orders/staff/all', {
            withCredentials: true
          }).then(response => {
            const newOrder = response.data.orders.find(order => 
              order.order_id === orderData.orderId
            );
            
            if (newOrder) {
              if ((showCompleted && newOrder.status === 'completed') || 
                  (!showCompleted && newOrder.status === 'processing')) {
                setOrders(prev => [newOrder, ...prev]);
              }
            }
          }).catch(error => {
            console.error('Error fetching new order data:', error);
          });
        }
      };

      // Handle order updates - use complete data from WebSocket when available
      const handleOrderUpdate = (orderData) => {
        console.log('Order update received via WebSocket:', orderData);
        
        // Check if we have complete order data with items
        if (orderData.items && Array.isArray(orderData.items)) {
          // We have complete order data from WebSocket
          console.log('Using complete order update data from WebSocket:', orderData);
          
          setOrders(prev => {
            const existingOrder = prev.find(order => order.order_id === orderData.order_id);
            if (existingOrder) {
              // Update existing order with complete data
              return prev.map(order => 
                order.order_id === orderData.order_id 
                  ? { ...order, ...orderData }
                  : order
              );
            } else {
              // Add new order if it matches current filter
              if ((showCompleted && orderData.status === 'completed') || 
                  (!showCompleted && orderData.status === 'processing')) {
                return [orderData, ...prev];
              }
            }
            return prev;
          });
        } else {
          // Fallback: update existing order with basic data
          setOrders(prev => {
            const existingOrder = prev.find(order => order.order_id === orderData.orderId);
            if (existingOrder) {
              return prev.map(order => 
                order.order_id === orderData.orderId 
                  ? { ...order, status: orderData.status }
                  : order
              );
            }
            return prev;
          });
          
          // If order not found in current list, fetch complete data
          const existingOrder = orders.find(order => order.order_id === orderData.orderId);
          if (!existingOrder) {
            axios.get('http://localhost:8801/orders/staff/all', {
              withCredentials: true
            }).then(response => {
              const updatedOrder = response.data.orders.find(order => 
                order.order_id === orderData.orderId
              );
              
              if (updatedOrder) {
                setOrders(prev => [updatedOrder, ...prev]);
              }
            }).catch(error => {
              console.error('Error fetching updated order data:', error);
            });
          }
        }
      };

      // Handle order status changes - same as order updates
      const handleOrderStatusChange = handleOrderUpdate;

      // Register WebSocket event listeners
      socketService.on('newOrder', handleNewOrder);
      socketService.on('orderUpdate', handleOrderUpdate);
      socketService.on('orderStatusChange', handleOrderStatusChange);

      // Cleanup listeners on unmount
      return () => {
        socketService.off('newOrder', handleNewOrder);
        socketService.off('orderUpdate', handleOrderUpdate);
        socketService.off('orderStatusChange', handleOrderStatusChange);
      };
    }, [showCompleted]); // Re-register when filter changes

    // Manual refresh function
    const handleRefresh = () => {
      fetchOrders();
    };

    const handleMarkDone = async (orderId) => {
      try {
        // Update order status to completed
        await axios.put(`http://localhost:8801/orders/staff/${orderId}/status`, 
          { status: 'completed' },
          { withCredentials: true }
        );
        
        setDoneOrders((prev) => [...prev, orderId]);
        setTimeout(() => {
          setOrders((prev) => prev.filter(order => order.order_id !== orderId));
        }, 300); // match the animation duration
        
        // Refresh orders after a short delay
        setTimeout(() => {
          fetchOrders();
        }, 500);
      } catch (err) {
        console.error('Error updating order status:', err);
        setError('Failed to update order status');
      }
    };

    const handleToggleBackToProcessing = async (orderId) => {
      try {
        // Update order status back to processing
        await axios.put(`http://localhost:8801/orders/staff/${orderId}/status`, 
          { status: 'processing' },
          { withCredentials: true }
        );
        
        // Refresh orders immediately
        fetchOrders();
      } catch (err) {
        console.error('Error updating order status:', err);
        setError('Failed to update order status');
      }
    };

    const handleDragStart = (order) => {
      setDraggedItem(order);
      setDragProgress(prev => ({ ...prev, [order.order_id]: 0 }));
    };

    const handleDrag = (event, info, orderId) => {
      // Calculate drag progress as percentage (0-100)
      const progress = Math.max(0, Math.min(100, (info.offset.x / 200) * 100));
      setDragProgress(prev => ({ ...prev, [orderId]: progress }));
    };

    const handleDragEnd = (event, info, orderId) => {
      setDraggedItem(null);
      
      // Check if dragged far enough to the right to mark as done (threshold: 60%)
      if (info.offset.x > 120) { // 60% of 200px
        handleMarkDone(orderId);
      }
      
      // Reset drag progress
      setDragProgress(prev => ({ ...prev, [orderId]: 0 }));
    };

    const reorderOrders = (startIndex, endIndex) => {
      const result = Array.from(orders);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      setOrders(result);
    };

    const getPriorityClass = (status) => {
      switch(status) {
        case 'processing': return classes.mediumPriority;
        default: return classes.lowPriority;
      }
    };

    const formatOrderText = (order) => {
      const itemDetails = order.items.map(item => {
        let itemText = `${item.item_name} x${item.quantity}`;
        
        // Add ingredients/options if they exist
        if (item.ingredients && item.ingredients.length > 0) {
          const ingredientsList = item.ingredients.map(ing => ing.ingredient_name).join(', ');
          itemText += ` (${ingredientsList})`;
        }
        
        return itemText;
      }).join(', ');
      
      return `Order #${order.order_id} - ${itemDetails}`;
    };

    const formatItemDetails = (item) => {
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

    const formatTime = (dateString) => {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatLastUpdate = () => {
      if (!lastFetchTime) return '';
      const now = new Date();
      const diff = Math.floor((now - lastFetchTime) / 1000);
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      return `${Math.floor(diff / 3600)}h ago`;
    };

    if (loading && orders.length === 0) {
      return (
        <div className={classes.container}>
          <div className={classes.loading}>
            <div className={classes.spinner}></div>
            <p>Loading orders...</p>
          </div>
        </div>
      );
    }

    if (error && orders.length === 0) {
      return (
        <div className={classes.container}>
          <div className={classes.error}>
            <p>{error}</p>
            <button onClick={handleRefresh} className={classes.retryButton}>
              Retry
            </button>
          </div>
        </div>
      );
    }
  
    return (
      <div className={classes.container}>
        <div className={classes.header}>
          <div className={classes.instructionText}>
            {showCompleted 
              ? '📋 Viewing completed orders - Click to mark back as processing'
              : '💡 Drag orders to reorder by priority or drag right to mark as done'
            }
          </div>
          <div className={classes.headerControls}>
            <div className={classes.toggleSection}>
              <ToggleSwitch
                isOn={showCompleted}
                onToggle={() => setShowCompleted(!showCompleted)}
                leftLabel="Processing Orders"
                rightLabel="Completed Orders"
              />
            </div>
            <button 
              onClick={handleRefresh} 
              className={classes.refreshButton}
              disabled={loading}
            >
              🔄 Refresh
            </button>
            {lastFetchTime && (
              <span className={classes.lastUpdate}>
                Last updated: {formatLastUpdate()}
              </span>
            )}
          </div>
        </div>
        
        {orders.length === 0 ? (
          <div className={classes.emptyState}>
            <div className={classes.emptyIcon}>
              {showCompleted ? '✅' : '📋'}
            </div>
            <h3>
              {showCompleted 
                ? 'No completed orders found'
                : 'No orders to prepare'
              }
            </h3>
            <p>
              {showCompleted 
                ? 'There are no completed orders in the system.'
                : 'All orders are completed or there are no processing orders.'
              }
            </p>
          </div>
        ) : (
          <div className={classes.ordersGrid}>
            <AnimatePresence>
              {orders.map((order, index) => (
                <motion.div
                  key={order.order_id}
                  layout
                  initial={{ x: 0, opacity: 1, scale: 1, rotate: 0 }}
                  animate={{ 
                    x: doneOrders.includes(order.order_id) ? -200 : 0, 
                    opacity: doneOrders.includes(order.order_id) ? 0 : 1,
                    scale: draggedItem?.order_id === order.order_id ? 1.05 : 1,
                    rotate: draggedItem?.order_id === order.order_id 
                      ? dragProgress[order.order_id] > 60 
                        ? 5 
                        : dragProgress[order.order_id] > 30 
                          ? 2 
                          : 0
                      : 0
                  }}
                  exit={{ x: -200, opacity: 0, scale: 0.8, rotate: -10 }}
                  transition={{ 
                    duration: 0.3,
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                  drag={showCompleted ? false : "x"}
                  dragConstraints={{ left: -50, right: 200 }}
                  dragElastic={0.2}
                  whileDrag={{ 
                    scale: 1.08, 
                    rotate: 3,
                    zIndex: 10,
                    boxShadow: "0 15px 35px rgba(0,0,0,0.4)"
                  }}
                  onDragStart={() => !showCompleted && handleDragStart(order)}
                  onDrag={(event, info) => !showCompleted && handleDrag(event, info, order.order_id)}
                  onDragEnd={(event, info) => !showCompleted && handleDragEnd(event, info, order.order_id)}
                  className={`${classes.orderCard} ${getPriorityClass(order.status)} ${draggedItem?.order_id === order.order_id ? classes.dragging : ''}`}
                  data-progress={
                    draggedItem?.order_id === order.order_id 
                      ? dragProgress[order.order_id] > 60 
                        ? "high" 
                        : dragProgress[order.order_id] > 30 
                          ? "medium" 
                          : "low"
                      : undefined
                  }
                  onClick={() => showCompleted 
                    ? handleToggleBackToProcessing(order.order_id)
                    : handleMarkDone(order.order_id)
                  }
                >
                  <div className={classes.orderHeader}>
                    <div className={classes.orderTitle}>
                      <span className={classes.orderNumber}>#{order.order_id}</span>
                      <span className={classes.orderStatus}>{order.status}</span>
                    </div>
                    <div className={classes.orderMeta}>
                      <span className={classes.orderType}>{order.order_type}</span>
                      <span className={classes.orderTime}>{formatTime(order.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className={classes.orderContent}>
                    <div className={classes.dragHandle}>⋮⋮</div>
                    
                    {/* Individual items with ingredients */}
                    <div className={classes.itemsList}>
                      {order.items.map((item, itemIndex) => (
                        <div key={itemIndex} className={classes.orderItemDetail}>
                          <div className={classes.itemMain}>
                            <span className={classes.itemName}>{item.item_name}</span>
                            <span className={classes.itemQuantity}>x{item.quantity}</span>
                          </div>
                          {formatItemDetails(item)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className={classes.orderFooter}>
                    <div className={classes.dragIndicator}>
                      {showCompleted ? (
                        "🔄 Click to mark back as processing"
                      ) : (
                        draggedItem?.order_id === order.order_id ? (
                          dragProgress[order.order_id] > 60 ? (
                            "↗️ Release to complete"
                          ) : dragProgress[order.order_id] > 30 ? (
                            "→ Keep dragging to complete"
                          ) : (
                            "→ Drag right to complete"
                          )
                        ) : (
                          "→ Drag right to complete"
                        )
                      )}
                    </div>
                  </div>
                  
                  {/* Drag progress indicator */}
                  <motion.div
                    className={classes.dragProgressBar}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: dragProgress[order.order_id] ? `${dragProgress[order.order_id]}%` : 0 
                    }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* Drop zone indicator */}
        <motion.div 
          className={`${classes.dropZone} ${draggedItem ? classes.visible : classes.hidden}`}
          animate={{ 
            opacity: draggedItem ? 1 : 0,
            scale: draggedItem ? 1 : 0.95
          }}
          transition={{ duration: 0.2 }}
        >
          ✅ Drop here to mark as completed
        </motion.div>
      </div>
    );
  }

export default MenuOrders; 