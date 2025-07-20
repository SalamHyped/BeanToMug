const { dbSingleton } = require('../dbSingleton');

/**
 * Process raw database rows into structured order data
 * @param {Array} rows - Raw database rows from the order query
 * @returns {Array} Array of structured order objects
 */
function processOrderRows(rows) {
    // Process the flat database results into a structured format
    // Group items by their parent order for easier frontend consumption
    const ordersMap = new Map();
    
    // Iterate through each row from the database
    rows.forEach(row => {
        // If this is a new order (not seen before), create the order object
        if (!ordersMap.has(row.order_id)) {
            ordersMap.set(row.order_id, {
                order_id: row.order_id,
                user_id: row.user_id,
                order_type: row.order_type,    // e.g., "Dine In", "Take Away"
                status: row.status,            // e.g., "pending", "completed", "failed"
                created_at: row.created_at,    // When the order was placed
                updated_at: row.updated_at,    // Last status update
                items: []                      // Array to hold order items
            });
        }
        
        // If this row contains item data (not just order data), add it to the order
        // Some rows might only have order data if an order has no items (edge case)
        if (row.item_id) {
            const order = ordersMap.get(row.order_id);
            
            // Check if this item already exists in the order
            let existingItem = order.items.find(item => item.order_item_id === row.order_item_id);
            
            if (!existingItem) {
                // Create new item
                existingItem = {
                    order_item_id: row.order_item_id,
                    item_id: row.item_id,
                    item_name: row.item_name,
                    price: parseFloat(row.price),  // Convert string to number for consistency
                    quantity: row.quantity,
                    ingredients: []  // Array to hold ingredients/options
                };
                order.items.push(existingItem);
            }
            
            // Add ingredient/option if it exists
            if (row.ingredient_id) {
                existingItem.ingredients.push({
                    ingredient_id: row.ingredient_id,
                    ingredient_name: row.ingredient_name,
                    price: parseFloat(row.ingredient_price || 0),
                    category: row.ingredient_type
                });
            }
        }
    });
    
    // Convert the Map to an array for JSON response
    return Array.from(ordersMap.values());
}

/**
 * Get complete order data with items and ingredients
 * @param {number} orderId - The order ID to fetch (optional, if not provided fetches all orders)
 * @returns {Object|Array} Complete order data or array of orders
 */
async function getCompleteOrderData(orderId = null) {
    try {
        const connection = await dbSingleton.getConnection();
        
        // Complex query to fetch complete order data with items and ingredients
        const query = `
            SELECT 
                o.order_id,
                o.user_id,
                o.order_type,
                o.status,
                o.created_at,
                o.updated_at,
                oi.order_item_id,
                oi.item_id,
                d.item_name,
                oi.price,
                oi.quantity,
                oii.ingredient_id,
                oii.price as ingredient_price,
                ing.ingredient_name,
                it.name as ingredient_type
            FROM orders o
            LEFT JOIN order_item oi ON o.order_id = oi.order_id
            LEFT JOIN dish d ON oi.item_id = d.item_id
            LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
            LEFT JOIN ingredient ing ON oii.ingredient_id = ing.ingredient_id
            LEFT JOIN ingredient_type it ON it.id = ing.type_id
            WHERE o.is_cart = 0
            ${orderId ? 'AND o.order_id = ?' : ''}
            ORDER BY o.created_at DESC, oi.order_item_id, oii.ingredient_id
        `;
        
        const params = orderId ? [orderId] : [];
        const [rows] = await connection.execute(query, params);
        
        if (rows.length === 0) {
            return orderId ? null : [];
        }
        
        // Process the rows into structured format
        const orders = processOrderRows(rows);
        
        // If fetching a specific order, return the first (and only) order
        if (orderId) {
            return orders[0] || null;
        }
        
        return orders;
    } catch (error) {
        console.error('Error fetching complete order data:', error);
        return orderId ? null : [];
    }
}

/**
 * Get recent orders for dashboard display (optimized)
 * @param {number} limit - Number of recent orders to fetch (default: 5)
 * @returns {Array} Array of recent orders with items and ingredients
 */
async function getRecentOrders(limit = 5) {
    try {
        const connection = await dbSingleton.getConnection();
        
        // Optimized query to fetch only recent orders
        const query = `
            SELECT 
                o.order_id,
                o.user_id,
                o.order_type,
                o.status,
                o.created_at,
                o.updated_at,
                oi.order_item_id,
                oi.item_id,
                d.item_name,
                oi.price,
                oi.quantity,
                oii.ingredient_id,
                oii.price as ingredient_price,
                ing.ingredient_name,
                it.name as ingredient_type
            FROM orders o
            LEFT JOIN order_item oi ON o.order_id = oi.order_id
            LEFT JOIN dish d ON oi.item_id = d.item_id
            LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
            LEFT JOIN ingredient ing ON oii.ingredient_id = ing.ingredient_id
            LEFT JOIN ingredient_type it ON it.id = ing.type_id
            WHERE o.is_cart = 0
            ORDER BY o.created_at DESC
            LIMIT ?
        `;
        
        const [rows] = await connection.execute(query, [limit * 10]); // Fetch more to account for orders with multiple items
        
        if (rows.length === 0) {
            return [];
        }
        
        // Process the rows into structured format
        const orders = processOrderRows(rows);
        
        // Return only the requested number of orders
        return orders.slice(0, limit);
    } catch (error) {
        console.error('Error fetching recent orders:', error);
        return [];
    }
}

module.exports = {
    getCompleteOrderData,
    getRecentOrders,
    processOrderRows
}; 