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
            // Combine first_name and last_name for customer_name
            const firstName = row.first_name || '';
            const lastName = row.last_name || '';
            const customerName = `${firstName} ${lastName}`.trim() || 'Guest Customer';
            
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
                // Customer information - include both formats for compatibility
                first_name: row.first_name,
                last_name: row.last_name,
                customer_name: customerName,
                customerName: customerName,  // camelCase variant
                email: row.email,
                customer_email: row.email,
                customerEmail: row.email,  // camelCase variant
                phone_number: row.phone_number || row.user_phone,
                items: []                      // Array to hold order items
            });
        }
        
        // If this row contains item data (not just order data), add it to the order
        // Some rows might only have order data if an order has no items (edge case)
        // Check for both item_id and order_item_id to handle NULL cases properly
        if (row.item_id != null && row.order_item_id != null) {
            const order = ordersMap.get(row.order_id);
            
            if (!order) {
                console.warn(`Order ${row.order_id} not found in map when processing item ${row.order_item_id}`);
                return; // Skip this row if order doesn't exist
            }
            
            // Check if this item already exists in the order
            let existingItem = order.items.find(item => item.order_item_id === row.order_item_id);
            
            if (!existingItem) {
                // Create new item - include both item_name and name for frontend compatibility
                const itemName = row.item_name || 'Unknown Item';
                existingItem = {
                    order_item_id: row.order_item_id,
                    item_id: row.item_id,
                    item_name: itemName,
                    name: itemName,  // Alias for frontend compatibility
                    price: parseFloat(row.price || 0),  // Convert string to number for consistency
                    price_with_vat: parseFloat(row.price_with_vat || row.price || 0),  // Fallback to base price if VAT not available
                    vat_amount: parseFloat(row.vat_amount || 0),  // Default to 0 if not available
                    quantity: parseInt(row.quantity || 1),  // Ensure quantity is an integer
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
    
    // Add open-ended date range filter - support date-only and datetime
    if (options.startDate || options.endDate) {
        // Check if startDate/endDate contain time (datetime format: has space or colon)
        const hasTime = (options.startDate.includes(' ') || options.startDate.includes(':')) ||
                        (options.endDate.includes(' ') || options.endDate.includes(':'));
        
        if (hasTime) {
            // Use datetime comparison for more precise filtering (includes time)
            // MySQL datetime format: 'YYYY-MM-DD HH:MM:SS'
            if (options.startDate && options.endDate) {
                whereClause += ' AND o.created_at >= ? AND o.created_at <= ?';
                params.push(options.startDate, options.endDate);
            } else if (options.startDate) {
                whereClause += ' AND o.created_at >= ?';
                params.push(options.startDate);
            } else if (options.endDate) {
                whereClause += ' AND o.created_at <= ?';
                params.push(options.endDate);
            }
        } else {
            // Date-only comparison (backward compatible)
            // MySQL date format: 'YYYY-MM-DD'
            if (options.startDate && options.endDate) {
                whereClause += ' AND DATE(o.created_at) BETWEEN ? AND ?';
                params.push(options.startDate, options.endDate);
            } else if (options.startDate) {
                whereClause += ' AND DATE(o.created_at) >= ?';
                params.push(options.startDate);
            } else if (options.endDate) {
                whereClause += ' AND DATE(o.created_at) <= ?';
                params.push(options.endDate);
            }
        }
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
    
    // Add user filter (for customer endpoints)
    if (options.userId) {
        whereClause += ' AND o.user_id = ?';
        params.push(options.userId);
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
            o.phone_number,
            u.first_name,
            u.last_name,
            u.email,
            u.phone_number as user_phone,
            oi.order_item_id,
            oi.item_id,
            d.item_name,
            oi.price,
            oi.price_with_vat,
            oi.vat_amount,
            oi.quantity,
            oii.ingredient_id,
            oii.price as ingredient_price,
            ing.ingredient_name,
            it.name as ingredient_type
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
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
        
        query += ` ORDER BY o.created_at ASC, oi.order_item_id, oii.ingredient_id`;
        
        // Add pagination if specified (will be handled by two-step approach in getCompleteOrderData)
        if (options.limit && options.offset !== undefined) {
            query += ` LIMIT ${options.limit} OFFSET ${options.offset}`;
        }
    } else {
        query += ` ORDER BY o.created_at ASC, oi.order_item_id, oii.ingredient_id`;
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
        
        // Single order fetch - use simple approach
        if (orderId) {
            const { query, params } = buildOrderQuery(orderId, options);
            const [rows] = await connection.execute(query, params);
            const orders = processOrderRows(rows);
            return orders[0] || null;
        }
        
        // Multiple orders with pagination - use two-step approach
        if (options && options.limit && options.offset !== undefined) {
            // Step 1: Get paginated order IDs only
            const { whereClause, params: filterParams } = buildWhereClause(options);
            
            const orderIdsQuery = `
                SELECT DISTINCT o.order_id
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                ${whereClause}
                ORDER BY o.created_at ASC
                LIMIT ? OFFSET ?
            `;
            
            const [orderIdRows] = await connection.execute(orderIdsQuery, [...filterParams, options.limit, options.offset]);
            
            // Get total count for pagination info
            const countResult = await getOrderCount(connection, options);
            
            if (orderIdRows.length === 0) {
                return {
                    orders: [],
                    totalCount: countResult.totalCount,
                    totalPages: countResult.totalPages
                };
            }
            
            // Step 2: Get complete data for those specific order IDs
            const orderIds = orderIdRows.map(row => row.order_id);
            const placeholders = orderIds.map(() => '?').join(',');
            
            const fullDataQuery = `
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
                    o.phone_number,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone_number as user_phone,
                    oi.order_item_id,
                    oi.item_id,
                    d.item_name,
                    oi.price,
                    oi.price_with_vat,
                    oi.vat_amount,
                    oi.quantity,
                    oii.ingredient_id,
                    oii.price as ingredient_price,
                    ing.ingredient_name,
                    it.name as ingredient_type
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN order_item oi ON o.order_id = oi.order_id
                LEFT JOIN dish d ON oi.item_id = d.item_id
                LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
                LEFT JOIN ingredient ing ON oii.ingredient_id = ing.ingredient_id
                LEFT JOIN ingredient_type it ON it.id = ing.type_id
                WHERE o.order_id IN (${placeholders})
                ORDER BY o.created_at ASC, oi.order_item_id, oii.ingredient_id
            `;
            
            const [fullDataRows] = await connection.execute(fullDataQuery, orderIds);
            const orders = processOrderRows(fullDataRows);
            
            return {
                orders: orders,
                totalCount: countResult.totalCount,
                totalPages: countResult.totalPages
            };
        }
        
        // No pagination - get all matching orders
        const { query, params } = buildOrderQuery(orderId, options);
        const [rows] = await connection.execute(query, params);
        const orders = processOrderRows(rows);
        
        // For non-paginated results, totalPages should be 1 since all data is returned
        return {
            orders: orders,
            totalCount: orders.length,
            totalPages: 1
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

/**
 * Get a single order by ID with items
 * @param {number} orderId - The order ID to fetch
 * @param {number|null} userId - User ID for authentication (null for guest orders)
 * @returns {Object|null} Order object with items or null if not found
 */
async function getSingleOrder(orderId, userId = null) {
    try {
        const connection = await dbSingleton.getConnection();
        
        // Build the WHERE clause based on user authentication
        let whereClause = 'WHERE order_id = ? AND is_cart = 0';
        let params = [orderId];
        
        if (userId !== null) {
            // Authenticated user - check ownership
            whereClause += ' AND user_id = ?';
            params.push(userId);
        } else {
            // Guest order - must have user_id = NULL
            whereClause += ' AND user_id IS NULL';
        }
        
        // Step 1: Get order details
        const orderQuery = `
            SELECT * FROM orders 
            ${whereClause}
        `;
        
        const [orderRows] = await connection.execute(orderQuery, params);
        
        if (orderRows.length === 0) {
            return null;
        }
        
        const order = orderRows[0];
        
        // Step 2: Get order items with ingredients using the same query structure as getCompleteOrderData
        const { query: itemsQuery, params: itemsParams } = buildOrderQuery(orderId, null);
        const [itemRows] = await connection.execute(itemsQuery, itemsParams);
        
        // Use the existing processOrderRows function to handle ingredients properly
        const processedOrders = processOrderRows(itemRows);
        const processedOrder = processedOrders[0]; // Get the first (and only) order
        
        if (!processedOrder) {
            return null;
        }
        
        // Return complete order with items and ingredients
        return {
            ...order,
            items: processedOrder.items
        };
        
    } catch (error) {
        console.error('Error fetching single order:', error);
        return null;
    }
}

module.exports = {
    getCompleteOrderData,
    getRecentOrders,
    processOrderRows,
    buildWhereClause,
    getOrderCount,
    buildOrderQuery,
    getSingleOrder
}; 