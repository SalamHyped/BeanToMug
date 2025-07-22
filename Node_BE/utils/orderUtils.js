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
                total_amount: row.total_amount,
                vat_amount: row.vat_amount,
                subtotal: row.subtotal,
                paypal_order_id: row.paypal_order_id,
                payment_method: row.paypal_order_id ? 'PayPal' : 'Not specified',
                payment_status: row.paypal_order_id ? 'Paid' : 'Pending',
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
 * Build WHERE clause and parameters for filtering
 * @param {Object} options - Filter options
 * @returns {Object} { whereClause, params }
 */
function buildWhereClause(options) {
    let whereClause = 'WHERE o.is_cart = 0';
    let params = [];
    
    if (!options) return { whereClause, params };
    
    // Add date filter
    if (options.dateFilter && options.dateFilter !== 'all') {
        switch (options.dateFilter) {
            case 'today':
                whereClause += ' AND DATE(o.created_at) = CURDATE()';
                break;
            case 'yesterday':
                whereClause += ' AND DATE(o.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
                break;
            case 'week':
                whereClause += ' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            case 'month':
                whereClause += ' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                break;
        }
    }
    
    // Add date range filter
    if (options.startDate && options.endDate) {
        whereClause += ' AND DATE(o.created_at) BETWEEN ? AND ?';
        params.push(options.startDate, options.endDate);
    }
    
    // Add status filter
    if (options.status) {
        whereClause += ' AND o.status = ?';
        params.push(options.status);
    }
    
    // Add search filter
    if (options.searchTerm && options.searchTerm.trim()) {
        whereClause += ' AND (o.order_id LIKE ? OR o.status LIKE ? OR o.order_type LIKE ?)';
        const searchParam = `%${options.searchTerm.trim()}%`;
        params.push(searchParam, searchParam, searchParam);
    }
    
    return { whereClause, params };
}

/**
 * Get total count for pagination
 * @param {Object} connection - Database connection
 * @param {Object} options - Filter options
 * @returns {Object} { totalCount, totalPages }
 */
async function getOrderCount(connection, options) {
    if (!options) return { totalCount: 0, totalPages: 0 };
    
    const { whereClause, params } = buildWhereClause(options);
    
    const countQuery = `
        SELECT COUNT(DISTINCT o.order_id) as total
        FROM orders o
        ${whereClause}
    `;
    
    const [countRows] = await connection.execute(countQuery, params);
    const totalCount = countRows[0].total;
    const totalPages = Math.ceil(totalCount / options.limit);
    
    return { totalCount, totalPages };
}

/**
 * Build the main query for fetching orders
 * @param {number} orderId - Specific order ID (optional)
 * @param {Object} options - Filter and pagination options
 * @returns {Object} { query, params }
 */
function buildOrderQuery(orderId, options) {
    let query = `
        SELECT 
            o.order_id,
            o.user_id,
            o.order_type,
            o.status,
            o.created_at,
            o.updated_at,
            o.total_price as total_amount,
            o.vat_amount,
            o.subtotal,
            o.paypal_order_id,
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
    `;
    
    let params = orderId ? [orderId] : [];
    
    if (options && !orderId) {
        const { whereClause, params: filterParams } = buildWhereClause(options);
        
        // Replace the WHERE clause
        query = query.replace('WHERE o.is_cart = 0', whereClause);
        params = [...params, ...filterParams];
        
        // Add pagination
        if (options.limit && options.offset !== undefined) {
            query += ` ORDER BY o.created_at DESC, oi.order_item_id, oii.ingredient_id`;
            query += ` LIMIT ${options.limit} OFFSET ${options.offset}`;
        }
    } else {
        query += ` ORDER BY o.created_at DESC, oi.order_item_id, oii.ingredient_id`;
    }
    
    return { query, params };
}

/**
 * Get complete order data with items and ingredients
 * @param {number} orderId - The order ID to fetch (optional, if not provided fetches all orders)
 * @param {Object} options - Options object { page, limit, offset, dateFilter, searchTerm }
 * @returns {Object|Array} Complete order data or array of orders with pagination info
 */
async function getCompleteOrderData(orderId = null, options = null) {
    try {
        const connection = await dbSingleton.getConnection();
        
        // Get total count for pagination
        let totalCount = 0;
        let totalPages = 0;
        
        if (options && !orderId) {
            const countResult = await getOrderCount(connection, options);
            totalCount = countResult.totalCount;
            totalPages = countResult.totalPages;
        }
        
        // Build and execute the main query
        const { query, params } = buildOrderQuery(orderId, options);
        const [rows] = await connection.execute(query, params);
        
        if (rows.length === 0) {
            if (orderId) {
                return null;
            } else {
                return {
                    orders: [],
                    totalCount: totalCount,
                    totalPages: totalPages
                };
            }
        }
        
        // Process the rows into structured format
        const orders = processOrderRows(rows);
        
        // If fetching a specific order, return the first (and only) order
        if (orderId) {
            return orders[0] || null;
        }
        
        // Return paginated results
        return {
            orders: orders,
            totalCount: totalCount,
            totalPages: totalPages
        };
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
                o.total_price as total_amount,
                o.vat_amount,
                o.subtotal,
                o.paypal_order_id,
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
    processOrderRows,
    buildWhereClause,
    getOrderCount,
    buildOrderQuery
}; 