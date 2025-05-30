import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import styles from './menuOrders.module.css';

const MenuOrders = () => {
 
    const [orders, setOrders] = useState([
      { id: 1, text: 'Coffee', priority: 'high' },
      { id: 2, text: 'Latte', priority: 'medium' },
      { id: 3, text: 'Cappuccino', priority: 'low' },
      { id: 4, text: 'Espresso', priority: 'high' },
      { id: 5, text: 'Americano', priority: 'medium' },
    ]);
  
    const [doneOrders, setDoneOrders] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
  
    const handleMarkDone = (id) => {
      setDoneOrders((prev) => [...prev, id]);
      setTimeout(() => {
        setOrders((prev) => prev.filter(order => order.id !== id));
      }, 300); // match the animation duration
    };

    const handleDragStart = (order) => {
      setDraggedItem(order);
    };

    const handleDragEnd = (event, info, orderId) => {
      setDraggedItem(null);
      
      // Check if dragged far enough to the right to mark as done
      if (info.offset.x > 200) {
        handleMarkDone(orderId);
      }
    };

    const reorderOrders = (startIndex, endIndex) => {
      const result = Array.from(orders);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      setOrders(result);
    };

    const getPriorityClass = (priority) => {
      switch(priority) {
        case 'high': return styles.highPriority;
        case 'medium': return styles.mediumPriority;
        case 'low': return styles.lowPriority;
        default: return '';
      }
    };
  
    return (
      <div className={styles.container}>
        <div className={styles.instructionText}>
          💡 Drag orders to reorder by priority or drag right to mark as done
        </div>
        <AnimatePresence>
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              layout
              initial={{ x: 0, opacity: 1, scale: 1 }}
              animate={{ 
                x: doneOrders.includes(order.id) ? -200 : 0, 
                opacity: doneOrders.includes(order.id) ? 0 : 1,
                scale: draggedItem?.id === order.id ? 1.05 : 1
              }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ 
                duration: 0.3,
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 200 }}
              dragElastic={0.2}
              whileDrag={{ 
                scale: 1.05, 
                rotate: 2,
                zIndex: 10,
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
              }}
              onDragStart={() => handleDragStart(order)}
              onDragEnd={(event, info) => handleDragEnd(event, info, order.id)}
              className={`${styles.orderItem} ${getPriorityClass(order.priority)} ${draggedItem?.id === order.id ? styles.dragging : ''}`}
              onClick={() => handleMarkDone(order.id)}
            >
              <div className={styles.orderContent}>
                <div className={styles.orderLeft}>
                  <div className={styles.dragHandle}>⋮⋮</div>
                  <div className={styles.orderInfo}>
                    <div className={styles.orderText}>{order.text}</div>
                    <div className={styles.priorityText}>
                      Priority: {order.priority}
                    </div>
                  </div>
                </div>
                <div className={styles.orderRight}>
                  {draggedItem?.id === order.id ? "↗️ Release to complete" : "→"}
                </div>
              </div>
              
              {/* Drag progress indicator */}
              <motion.div
                className={styles.dragProgressBar}
                initial={{ width: 0 }}
                animate={{ 
                  width: draggedItem?.id === order.id ? "30%" : 0 
                }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Drop zone indicator */}
        <motion.div 
          className={`${styles.dropZone} ${draggedItem ? styles.visible : styles.hidden}`}
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