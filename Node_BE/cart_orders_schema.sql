-- Enhanced Orders Table Schema for Cart + Order System
-- Uses boolean is_cart field instead of status enum

-- Update existing orders table or create new one
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    paypal_order_id VARCHAR(255) NULL,  -- NULL for cart, filled for PayPal orders
    user_id INT NULL,                   -- NULL for guests, filled for logged users
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    customer_email VARCHAR(255) NULL,
    is_cart BOOLEAN DEFAULT TRUE,       -- TRUE for cart, FALSE for completed orders
    status ENUM('pending', 'completed', 'failed', 'refunded') NULL, -- Order status (NULL for carts)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    UNIQUE KEY unique_paypal_order (paypal_order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_is_cart (is_cart),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    -- Only one active cart per user
    UNIQUE KEY unique_user_cart (user_id) WHERE is_cart = TRUE AND user_id IS NOT NULL
);

-- Order items table (no changes needed)
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    item_options JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES dish(item_id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_item_id (item_id)
);

-- Migration commands for existing table
-- ALTER TABLE orders ADD COLUMN is_cart BOOLEAN DEFAULT TRUE;
-- ALTER TABLE orders DROP INDEX unique_user_cart;
-- ALTER TABLE orders DROP INDEX unique_session_cart;
-- ALTER TABLE orders DROP COLUMN session_id;
-- ALTER TABLE orders ADD UNIQUE KEY unique_user_cart (user_id) WHERE is_cart = TRUE AND user_id IS NOT NULL; 