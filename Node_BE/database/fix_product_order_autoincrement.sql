-- Fix product_order table to use AUTO_INCREMENT for order_id
-- This will prevent duplicate key errors when creating new orders

-- First, drop the existing primary key constraint
ALTER TABLE `product_order` DROP PRIMARY KEY;

-- Modify the order_id column to be AUTO_INCREMENT
ALTER TABLE `product_order` MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT;

-- Re-add the primary key constraint
ALTER TABLE `product_order` ADD PRIMARY KEY (`order_id`);

-- Set the AUTO_INCREMENT to start from the next available ID
-- This will ensure new orders get unique IDs
SET @max_id = (SELECT COALESCE(MAX(order_id), 0) + 1 FROM product_order);
SET @sql = CONCAT('ALTER TABLE `product_order` AUTO_INCREMENT = ', @max_id);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Product order table fixed successfully!' as message;
SELECT CONCAT('AUTO_INCREMENT set to start from: ', @max_id) as auto_increment_value;
