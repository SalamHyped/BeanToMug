const express = require('express');
const router = express.Router();
const { dbSingleton } = require('../dbSingleton');
const {
  handleError, sendSuccess, validateRequiredFields, validateId,
  checkRecordExists, getRecords, asyncHandler, buildWhereClause,
  validateSort, calculatePagination, createPaginationResponse
} = require('../utils/routeHelpers');

/**
 * Product Order Management Routes
 * Using router helpers for consistency with other routes
 * 
 * Available endpoints:
 * - GET /product-orders - Get all product orders with filtering
 * - GET /product-orders/:id - Get specific product order details  
 * - GET /product-orders/supplier/:supplier_id/ingredients - Get ingredients for a supplier
 * - POST /product-orders - Create new product order
 * - PUT /product-orders/:id - Update product order
 * - PUT /product-orders/:id/status - Update order status
 * - DELETE /product-orders/:id - Delete product order
 */

/**
 * GET /product-orders/supplier/:supplier_id/ingredients
 * Get all ingredients for a specific supplier
 * Useful for creating new orders
 */
router.get('/supplier/:supplier_id/ingredients', asyncHandler(async (req, res) => {
  const { supplier_id } = req.params;

  // Validate ID parameter using helper
  const idError = validateId(supplier_id);
  if (idError) {
    return handleError(res, new Error(idError), 'Invalid supplier ID', 400);
  }

  try {
    const connection = await dbSingleton.getConnection();

    // Check if supplier exists using helper
    const supplierExists = await checkRecordExists(connection, 'supplier', 'supplier_id', supplier_id);
    if (!supplierExists) {
      return handleError(res, new Error('Supplier not found'), 'Supplier not found', 404);
    }

    // Get all ingredients for this supplier
    const ingredients = await getRecords(connection, `
      SELECT 
        i.ingredient_id,
        i.ingredient_name,
        i.price,
        i.brand,
        i.unit,
        i.quantity_in_stock,
        i.low_stock_threshold,
        i.status,
        it.name as ingredient_type,
        ic.name as ingredient_category
      FROM ingredient i
      LEFT JOIN ingredient_type it ON i.type_id = it.id
      LEFT JOIN ingredient_category ic ON i.type_id = ic.id
      WHERE i.supplier_id = ? AND i.status = 1
      ORDER BY i.ingredient_name ASC
    `, [supplier_id]);

    // Get supplier details
    const supplier = await getRecords(connection, `
      SELECT supplier_id, supplier_name, phone_number, email, status
      FROM supplier 
      WHERE supplier_id = ?
    `, [supplier_id]);

    sendSuccess(res, {
      supplier: supplier[0],
      ingredients: ingredients.map(ing => ({
        ...ing,
        price: parseFloat(ing.price) || 0,
        quantity_in_stock: parseFloat(ing.quantity_in_stock) || 0,
        low_stock_threshold: parseFloat(ing.low_stock_threshold) || 0,
        is_low_stock: parseFloat(ing.quantity_in_stock) <= parseFloat(ing.low_stock_threshold),
        suggested_order_quantity: Math.max(
          parseFloat(ing.low_stock_threshold) - parseFloat(ing.quantity_in_stock),
          0
        )
      }))
    });

  } catch (error) {
    handleError(res, error, 'Failed to fetch supplier ingredients');
  }
}));

/**
 * GET /product-orders/statistics
 * Get product order statistics for dashboard
 */
router.get('/statistics', asyncHandler(async (req, res) => {
  try {
    const connection = await dbSingleton.getConnection();

    // Get order statistics
    const stats = await getRecords(connection, `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(total_price) as total_value,
        AVG(total_price) as average_order_value,
        COUNT(DISTINCT supplier_id) as active_suppliers
      FROM product_order
    `);

    // Get recent orders (last 5)
    const recentOrders = await getRecords(connection, `
      SELECT 
        po.order_id,
        po.total_price,
        po.order_start_date,
        po.status,
        s.supplier_name
      FROM product_order po
      LEFT JOIN supplier s ON po.supplier_id = s.supplier_id
      ORDER BY po.order_start_date DESC
      LIMIT 5
    `);

    // Get supplier order counts
    const supplierStats = await getRecords(connection, `
      SELECT 
        s.supplier_name,
        COUNT(po.order_id) as order_count,
        SUM(po.total_price) as total_value
      FROM supplier s
      LEFT JOIN product_order po ON s.supplier_id = po.supplier_id
      WHERE s.status = 1
      GROUP BY s.supplier_id, s.supplier_name
      ORDER BY order_count DESC
      LIMIT 10
    `);

    sendSuccess(res, {
      overview: {
        ...stats[0],
        total_orders: parseInt(stats[0].total_orders) || 0,
        pending_orders: parseInt(stats[0].pending_orders) || 0,
        shipped_orders: parseInt(stats[0].shipped_orders) || 0,
        received_orders: parseInt(stats[0].received_orders) || 0,
        cancelled_orders: parseInt(stats[0].cancelled_orders) || 0,
        total_value: parseFloat(stats[0].total_value) || 0,
        average_order_value: parseFloat(stats[0].average_order_value) || 0,
        active_suppliers: parseInt(stats[0].active_suppliers) || 0
      },
      recent_orders: recentOrders.map(order => ({
        ...order,
        total_price: parseFloat(order.total_price) || 0
      })),
      supplier_stats: supplierStats.map(stat => ({
        ...stat,
        order_count: parseInt(stat.order_count) || 0,
        total_value: parseFloat(stat.total_value) || 0
      }))
    });

  } catch (error) {
    handleError(res, error, 'Failed to fetch order statistics');
  }
}));

/**
 * GET /product-orders
 * Retrieve all product orders with optional filtering and search
 * 
 * Query parameters:
 * - supplier_id: Filter by supplier
 * - status: Filter by status (pending, shipped, received, cancelled, all)
 * - date_from: Filter orders from this date
 * - date_to: Filter orders until this date
 * - sortBy: Sort field (order_start_date, total_price, etc.)
 * - sortOrder: Sort direction (asc, desc)
 * - page: Page number for pagination
 * - limit: Items per page
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    supplier_id = '',
    status = 'all',
    date_from = '',
    date_to = '',
    sortBy = 'order_start_date',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = req.query;

  try {
    const connection = await dbSingleton.getConnection();
    
    // Define filter mapping for buildWhereClause helper
    const filterMap = {
      supplier_id: (value) => ({
        condition: 'po.supplier_id = ?',
        params: [parseInt(value)]
      }),
      status: (value) => ({
        condition: 'po.status = ?',
        params: [value]
      }),
      date_from: (value) => ({
        condition: 'DATE(po.order_start_date) >= ?',
        params: [value]
      }),
      date_to: (value) => ({
        condition: 'DATE(po.order_start_date) <= ?',
        params: [value]
      })
    };

    // Build WHERE clause using helper
    const filters = {
      supplier_id: supplier_id || null,
      status: status !== 'all' ? status : null,
      date_from: date_from || null,
      date_to: date_to || null
    };
    
    const { whereClause, queryParams } = buildWhereClause(filters, filterMap);

    // Validate sort parameters using helper
    const allowedSortFields = ['order_start_date', 'order_end_date', 'total_price', 'status', 'supplier_name'];
    const { sortField, order } = validateSort(sortBy, sortOrder, allowedSortFields, 'order_start_date');

    // Calculate pagination using helper
    const { offset, limit: limitNum, page: pageNum } = calculatePagination(page, limit, 100);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM product_order po
      LEFT JOIN supplier s ON po.supplier_id = s.supplier_id
      ${whereClause}
    `;
    const [countResult] = await connection.execute(countQuery, queryParams);
    const totalCount = countResult[0].total;

    // Main query with product order data and supplier info
    const mainQuery = `
      SELECT 
        po.order_id,
        po.total_price,
        po.order_start_date,
        po.order_end_date,
        po.status,
        po.supplier_id,
        s.supplier_name,
        s.phone_number as supplier_phone,
        s.email as supplier_email,
        COUNT(poi.id) as item_count,
        SUM(poi.quantity_ordered) as total_quantity
      FROM product_order po
      LEFT JOIN supplier s ON po.supplier_id = s.supplier_id
      LEFT JOIN product_order_item poi ON po.order_id = poi.product_order_id
      ${whereClause}
      GROUP BY po.order_id
      ORDER BY ${sortField === 'supplier_name' ? 's.supplier_name' : 'po.' + sortField} ${order}
      LIMIT ? OFFSET ?
    `;

    const [orders] = await connection.execute(mainQuery, [...queryParams, limitNum, offset]);

    // Format the response
    const formattedOrders = orders.map(order => ({
      ...order,
      item_count: parseInt(order.item_count) || 0,
      total_quantity: parseFloat(order.total_quantity) || 0,
      total_price: parseFloat(order.total_price) || 0,
      status_display: order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'
    }));

    // Create pagination response using helper
    const pagination = createPaginationResponse(pageNum, limitNum, totalCount);

    sendSuccess(res, {
      orders: formattedOrders,
      pagination,
      filters: {
        supplier_id,
        status,
        date_from,
        date_to,
        sortBy: sortField,
        sortOrder: order
      }
    });

  } catch (error) {
    handleError(res, error, 'Failed to fetch product orders');
  }
}));

/**
 * GET /product-orders/:id
 * Get detailed information about a specific product order
 * Including all items in the order with ingredient details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID parameter using helper
  const idError = validateId(id);
  if (idError) {
    return handleError(res, new Error(idError), idError, 400);
  }

  try {
    const connection = await dbSingleton.getConnection();

    // Check if product order exists using helper
    const orderExists = await checkRecordExists(connection, 'product_order', 'order_id', id);
    if (!orderExists) {
      return handleError(res, new Error('Product order not found'), 'Product order not found', 404);
    }

    // Get product order details using helper
    const orderDetails = await getRecords(connection, `
      SELECT 
        po.order_id,
        po.total_price,
        po.order_start_date,
        po.order_end_date,
        po.status,
        po.supplier_id,
        s.supplier_name,
        s.phone_number as supplier_phone,
        s.email as supplier_email,
        s.status as supplier_status
      FROM product_order po
      LEFT JOIN supplier s ON po.supplier_id = s.supplier_id
      WHERE po.order_id = ?
    `, [id]);

    // Get all items in this order using helper
    const orderItems = await getRecords(connection, `
      SELECT 
        poi.id as order_item_id,
        poi.quantity_ordered,
        poi.unit_cost,
        (poi.quantity_ordered * poi.unit_cost) as total_cost,
        poi.ingredient_id,
        i.ingredient_name,
        i.unit,
        i.brand,
        i.quantity_in_stock,
        i.low_stock_threshold,
        it.name as ingredient_type
      FROM product_order_item poi
      LEFT JOIN ingredient i ON poi.ingredient_id = i.ingredient_id
      LEFT JOIN ingredient_type it ON i.type_id = it.id
      WHERE poi.product_order_id = ?
      ORDER BY i.ingredient_name ASC
    `, [id]);

    sendSuccess(res, {
      order: {
        ...orderDetails[0],
        total_price: parseFloat(orderDetails[0].total_price) || 0,
        status_display: orderDetails[0].status ? 
          orderDetails[0].status.charAt(0).toUpperCase() + orderDetails[0].status.slice(1) : 'Unknown'
      },
      items: orderItems.map(item => ({
        ...item,
        quantity_ordered: parseFloat(item.quantity_ordered) || 0,
        unit_cost: parseFloat(item.unit_cost) || 0,
        total_cost: parseFloat(item.total_cost) || 0,
        quantity_in_stock: parseFloat(item.quantity_in_stock) || 0,
        low_stock_threshold: parseFloat(item.low_stock_threshold) || 0,
        is_low_stock: parseFloat(item.quantity_in_stock) <= parseFloat(item.low_stock_threshold)
      })),
      statistics: {
        total_items: orderItems.length,
        total_quantity: orderItems.reduce((sum, item) => sum + parseFloat(item.quantity_ordered || 0), 0),
        calculated_total: orderItems.reduce((sum, item) => 
          sum + (parseFloat(item.quantity_ordered || 0) * parseFloat(item.unit_cost || 0)), 0
        )
      }
    });

  } catch (error) {
    handleError(res, error, 'Failed to fetch product order details');
  }
}));

/**
 * POST /product-orders
 * Create a new product order
 * 
 * Body should contain:
 * - supplier_id: ID of the supplier
 * - order_end_date: Expected delivery date
 * - items: Array of {ingredient_id, quantity_ordered, unit_cost}
 */
router.post('/', asyncHandler(async (req, res) => {
  const {
    supplier_id,
    order_end_date,
    items = []
  } = req.body;

  // Validate required fields using helper
  const validationError = validateRequiredFields(req.body, ['supplier_id', 'order_end_date', 'items']);
  if (validationError) {
    return handleError(res, new Error(validationError), validationError, 400);
  }

  // Additional validation
  if (!Array.isArray(items) || items.length === 0) {
    return handleError(res, new Error('Items array is required and must not be empty'), 'Items array is required and must not be empty', 400);
  }

  try {
    const connection = await dbSingleton.getConnection();

    // Check if supplier exists using helper
    const supplierExists = await checkRecordExists(connection, 'supplier', 'supplier_id', supplier_id);
    if (!supplierExists) {
      return handleError(res, new Error('Supplier not found'), 'Supplier not found', 404);
    }

    // Validate all ingredients exist and belong to the supplier
    for (const item of items) {
      if (!item.ingredient_id || !item.quantity_ordered || !item.unit_cost) {
        return handleError(res, new Error('Each item must have ingredient_id, quantity_ordered, and unit_cost'), 
          'Invalid item data', 400);
      }

      const ingredient = await getRecords(connection,
        'SELECT ingredient_id, supplier_id FROM ingredient WHERE ingredient_id = ?',
        [item.ingredient_id]
      );

      if (ingredient.length === 0) {
        return handleError(res, new Error(`Ingredient ${item.ingredient_id} not found`), 
          `Ingredient ${item.ingredient_id} not found`, 404);
      }

      if (ingredient[0].supplier_id !== parseInt(supplier_id)) {
        return handleError(res, new Error(`Ingredient ${item.ingredient_id} does not belong to this supplier`), 
          `Ingredient ${item.ingredient_id} does not belong to this supplier`, 400);
      }
    }

    // Calculate total price
    const total_price = items.reduce((sum, item) => 
      sum + (parseFloat(item.quantity_ordered) * parseFloat(item.unit_cost)), 0
    );

    // Start transaction
    await connection.beginTransaction();

    try {
      // Create the product order
      const [orderResult] = await connection.execute(`
        INSERT INTO product_order (
          supplier_id, total_price, order_start_date, order_end_date, status
        ) VALUES (?, ?, NOW(), ?, 'pending')
      `, [supplier_id, total_price, order_end_date]);

      const orderId = orderResult.insertId;

      // Insert all order items
      for (const item of items) {
        await connection.execute(`
          INSERT INTO product_order_item (
            product_order_id, ingredient_id, quantity_ordered, unit_cost
          ) VALUES (?, ?, ?, ?)
        `, [orderId, item.ingredient_id, item.quantity_ordered, item.unit_cost]);
      }

      await connection.commit();

      sendSuccess(res, {
        order_id: orderId,
        supplier_id: parseInt(supplier_id),
        total_price,
        order_end_date,
        status: 'pending',
        items_count: items.length
      }, 'Product order created successfully', 201);

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    handleError(res, error, 'Failed to create product order');
  }
}));

/**
 * PUT /product-orders/:id/status
 * Update product order status
 * 
 * Body should contain:
 * - status: New status (pending, shipped, received, cancelled)
 */
router.put('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate ID and required fields using helpers
  const idError = validateId(id);
  if (idError) {
    return handleError(res, new Error(idError), idError, 400);
  }

  const validationError = validateRequiredFields(req.body, ['status']);
  if (validationError) {
    return handleError(res, new Error(validationError), validationError, 400);
  }

  // Validate status value
  const allowedStatuses = ['pending', 'shipped', 'received', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return handleError(res, new Error('Invalid status'), 
      `Status must be one of: ${allowedStatuses.join(', ')}`, 400);
  }

  try {
    const connection = await dbSingleton.getConnection();

    // Check if product order exists using helper
    const orderExists = await checkRecordExists(connection, 'product_order', 'order_id', id);
    if (!orderExists) {
      return handleError(res, new Error('Product order not found'), 'Product order not found', 404);
    }

    // Update status
    await connection.execute(
      'UPDATE product_order SET status = ? WHERE order_id = ?',
      [status, id]
    );

    sendSuccess(res, {
      order_id: parseInt(id),
      new_status: status,
      status_display: status.charAt(0).toUpperCase() + status.slice(1)
    }, `Order status updated to ${status} successfully`);

  } catch (error) {
    handleError(res, error, 'Failed to update order status');
  }
}));

/**
 * PUT /product-orders/:id
 * Update product order details
 * 
 * Body can contain:
 * - order_end_date: Expected delivery date
 * - items: Array of {ingredient_id, quantity_ordered, unit_cost} (replaces all items)
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { order_end_date, items } = req.body;

  // Validate ID parameter using helper
  const idError = validateId(id);
  if (idError) {
    return handleError(res, new Error(idError), idError, 400);
  }

  try {
    const connection = await dbSingleton.getConnection();

    // Check if product order exists and get current details
    const orderDetails = await getRecords(connection,
      'SELECT order_id, supplier_id, status FROM product_order WHERE order_id = ?',
      [id]
    );

    if (orderDetails.length === 0) {
      return handleError(res, new Error('Product order not found'), 'Product order not found', 404);
    }

    const currentOrder = orderDetails[0];

    // Don't allow editing of shipped, received, or cancelled orders
    if (['shipped', 'received', 'cancelled'].includes(currentOrder.status)) {
      return handleError(res, new Error('Cannot edit order in current status'), 
        `Cannot edit order with status: ${currentOrder.status}`, 400);
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      let updates = [];
      let updateParams = [];

      // Update order_end_date if provided
      if (order_end_date) {
        updates.push('order_end_date = ?');
        updateParams.push(order_end_date);
      }

      // If items are provided, validate and replace all items
      if (items && Array.isArray(items)) {
        if (items.length === 0) {
          await connection.rollback();
          return handleError(res, new Error('Items array must not be empty'), 'Items array must not be empty', 400);
        }

        // Validate all ingredients exist and belong to the supplier
        for (const item of items) {
          if (!item.ingredient_id || !item.quantity_ordered || !item.unit_cost) {
            await connection.rollback();
            return handleError(res, new Error('Each item must have ingredient_id, quantity_ordered, and unit_cost'), 
              'Invalid item data', 400);
          }

          const ingredient = await getRecords(connection,
            'SELECT ingredient_id, supplier_id FROM ingredient WHERE ingredient_id = ?',
            [item.ingredient_id]
          );

          if (ingredient.length === 0) {
            await connection.rollback();
            return handleError(res, new Error(`Ingredient ${item.ingredient_id} not found`), 
              `Ingredient ${item.ingredient_id} not found`, 404);
          }

          if (ingredient[0].supplier_id !== currentOrder.supplier_id) {
            await connection.rollback();
            return handleError(res, new Error(`Ingredient ${item.ingredient_id} does not belong to this supplier`), 
              `Ingredient ${item.ingredient_id} does not belong to this supplier`, 400);
          }
        }

        // Calculate new total price
        const total_price = items.reduce((sum, item) => 
          sum + (parseFloat(item.quantity_ordered) * parseFloat(item.unit_cost)), 0
        );

        updates.push('total_price = ?');
        updateParams.push(total_price);

        // Delete existing items
        await connection.execute('DELETE FROM product_order_item WHERE product_order_id = ?', [id]);

        // Insert new items
        for (const item of items) {
          await connection.execute(`
            INSERT INTO product_order_item (
              product_order_id, ingredient_id, quantity_ordered, unit_cost
            ) VALUES (?, ?, ?, ?)
          `, [id, item.ingredient_id, item.quantity_ordered, item.unit_cost]);
        }
      }

      // Update the order if there are any updates
      if (updates.length > 0) {
        updateParams.push(id);
        await connection.execute(
          `UPDATE product_order SET ${updates.join(', ')} WHERE order_id = ?`,
          updateParams
        );
      }

      await connection.commit();

      sendSuccess(res, {}, 'Product order updated successfully');

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    handleError(res, error, 'Failed to update product order');
  }
}));

/**
 * DELETE /product-orders/:id
 * Delete a product order (only if status is pending)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID parameter using helper
  const idError = validateId(id);
  if (idError) {
    return handleError(res, new Error(idError), idError, 400);
  }

  try {
    const connection = await dbSingleton.getConnection();

    // Check if product order exists and get status
    const orderDetails = await getRecords(connection,
      'SELECT order_id, status FROM product_order WHERE order_id = ?',
      [id]
    );

    if (orderDetails.length === 0) {
      return handleError(res, new Error('Product order not found'), 'Product order not found', 404);
    }

    const currentOrder = orderDetails[0];

    // Only allow deletion of pending orders
    if (currentOrder.status !== 'pending') {
      return handleError(res, new Error('Cannot delete order in current status'), 
        `Cannot delete order with status: ${currentOrder.status}. Only pending orders can be deleted.`, 400);
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      // Delete order items first (foreign key constraint)
      await connection.execute('DELETE FROM product_order_item WHERE product_order_id = ?', [id]);
      
      // Delete the order
      await connection.execute('DELETE FROM product_order WHERE order_id = ?', [id]);

      await connection.commit();

      sendSuccess(res, {}, 'Product order deleted successfully');

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    handleError(res, error, 'Failed to delete product order');
  }
}));

module.exports = router;
