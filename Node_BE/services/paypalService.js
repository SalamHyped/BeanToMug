const { paypalClient } = require("../paypalClient");
const { dbSingleton } = require("../dbSingleton");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");

/**
 * PayPal Service
 * Handles PayPal API interactions and order processing for both guests and users
 */

class PayPalService {



  async createOrderFromCart(userId, sessionCart = []) {
    let connection;

    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();

      let orderData;

      if (userId) {
        orderData = await this.createOrderFromUserCart(connection, userId);
      } else {
        orderData = await this.createOrderFromSessionCart(
          connection,
          sessionCart
        );
      }

      await connection.commit();
      return orderData;
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    }
  }




  async createOrderFromUserCart(connection, userId) {
    const cart = await this.findUserCart(connection, userId);
    if (!cart) {
      throw new Error("No cart found");
    }

    const { items, totalAmount } = await this.validateCartItems(
      connection,
      cart.order_id
    );
    if (items.length === 0) {
      throw new Error("Cart is empty");
    }

    const paypalOrder = await this.createPayPalOrder(
      totalAmount,
      cart.order_id,
      "user"
    );

    await this.convertCartToOrder(
      connection,
      cart.order_id,
      paypalOrder.id,
      totalAmount
    );

    return {
      order_id: paypalOrder.id,
      total_amount: totalAmount,
      db_order_id: cart.id,
      order_type: "user",
    };
  }

  async createOrderFromSessionCart(connection, sessionCart) {
    if (!sessionCart || sessionCart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const { validatedItems, totalAmount } = await this.validateSessionCartItems(
      connection,
      sessionCart
    );

    const [orderResult] = await connection.execute(
      `
      INSERT INTO orders (user_id, is_cart, total_price, status, created_at)
      VALUES (NULL, FALSE, ?, 'pending', NOW())
    `,
      [totalAmount]
    );

    const tempOrderId = orderResult.insertId;

    for (const item of validatedItems) {
      const [itemResult] = await connection.execute(
        `
        INSERT INTO order_item (order_id, item_id, quantity, price, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `,
        [
          tempOrderId,
          item.item_id,
          item.quantity,
          item.item_price
        ]
      );

      if (item.options) {
        const optionIds = Object.values(item.options);
        if (optionIds.length > 0) {
          const placeholders = optionIds.map(() => '?').join(',');
          const [ingredients] = await connection.execute(`
            SELECT ingredient_id, price
            FROM ingredient
            WHERE ingredient_id IN (${placeholders})
          `, optionIds);

          for (const ingredient of ingredients) {
            await connection.execute(`
              INSERT INTO order_item_ingredient (order_item_id, ingredient_id, price)
              VALUES (?, ?, ?)
            `, [itemResult.insertId, ingredient.ingredient_id, ingredient.price]);
          }
        }
      }
    }

    const paypalOrder = await this.createPayPalOrder(
      totalAmount,
      tempOrderId,
      "guest"
    );

    await connection.execute(
      `
      UPDATE orders SET paypal_order_id = ? WHERE order_id = ?
    `,
      [paypalOrder.id, tempOrderId]
    );

    return {
      order_id: paypalOrder.id,
      total_amount: totalAmount,
      db_order_id: tempOrderId,
      order_type: "guest",
    };
  }

  async validateSessionCartItems(connection, sessionCart) {
    const validatedItems = [];
    let totalAmount = 0;
    const priceDiscrepancies = [];

    for (const cartItem of sessionCart.items) {
      const [dbItem] = await connection.execute(
        "SELECT item_id, item_name, price FROM dish WHERE item_id = ?",
        [cartItem.item_id]
      );

      if (dbItem.length === 0) {
        throw new Error(
          `Item ${
            cartItem.item_name || cartItem.item_id
          } is no longer available`
        );
      }

      const currentPrice = dbItem[0].price;

      if (Math.abs(cartItem.item_price - currentPrice) > 0.01) {
        priceDiscrepancies.push({
          item_id: cartItem.item_id,
          item_name: cartItem.item_name,
          cart_price: cartItem.item_price,
          current_price: currentPrice,
        });
      }

      const validatedItem = {
        ...cartItem,
        item_price: currentPrice,
      };

      validatedItems.push(validatedItem);
      totalAmount += currentPrice * cartItem.quantity;
    }

    if (priceDiscrepancies.length > 0) {
      const error = new Error(
        "Prices have changed since items were added to cart"
      );
      error.code = "PRICE_CHANGED";
      error.priceChanges = priceDiscrepancies;
      error.newTotal = totalAmount;
      throw error;
    }

    return { validatedItems, totalAmount };
  }

  async completePayment(orderId) {
    let connection;

    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();

      const order = await this.findPendingOrder(connection, orderId);
      if (!order) {
        throw new Error("Order not found or already processed");
      }

      try {
        const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(
          orderId
        );
        request.requestBody({});

        const captureResult = await paypalClient.execute(request);
        if (captureResult.result.status === "COMPLETED") {
          await this.markOrderCompleted(connection, order.order_id);
          await connection.commit();
          
          return {
            success: true,
            paypal_order_id: orderId,
            capture_id:
              captureResult.result.purchase_units[0].payments.captures[0].id,
            order_id: order.order_id,
            
            is_guest: order.user_id === null,
          };
        } else {
          throw new Error(
            `Payment capture failed with status: ${captureResult.result.status}`
          );
        }
      } catch (paypalError) {
        if (order.user_id) {
          await this.revertOrderToCart(connection, order.id);
        } else {
          await this.deleteGuestOrder(connection, order.order_id);
        }
        await connection.commit();
        throw new Error(`Payment capture failed: ${paypalError.message}`);
      }
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    }
  }

  async cancelOrder(orderId) {
    let connection;

    try {
      connection = await dbSingleton.getConnection();
      await connection.beginTransaction();

      const [orders] = await connection.execute(
        `
        SELECT * FROM orders
        WHERE paypal_order_id = ? AND status = 'pending' AND is_cart = FALSE
      `,
        [orderId]
      );

      if (orders.length === 0) {
        throw new Error("Order not found");
      }

      const order = orders[0];

      if (order.user_id) {
        await connection.execute(
          `
          UPDATE orders
          SET is_cart = TRUE,
              status = NULL,
              paypal_order_id = NULL,
              updated_at = NOW()
          WHERE id = ?
        `,
          [order.id]
        );
      } else {
        await this.deleteGuestOrder(connection, order.order_id);
      }

      await connection.commit();

      return { success: true, message: "Order cancelled successfully" };
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    }
  }

  async getOrderHistory(userId) {
    if (!userId) {
      return [];
    }

    const connection = await dbSingleton.getConnection();

    const [orders] = await connection.execute(
      `
      SELECT
        o.*,
        GROUP_CONCAT(
          CONCAT(d.item_name, ' x', oi.quantity)
          SEPARATOR ', '
        ) as items_summary
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN dish d ON oi.item_id = d.item_id
      WHERE o.is_cart = FALSE
      AND o.status IN ('completed', 'failed', 'refunded')
      AND o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 20
    `,
      [userId]
    );

    return orders;
  }

  async findUserCart(connection, userId) {
    const [carts] = await connection.execute(
      `
      SELECT * FROM orders
      WHERE user_id = ? AND is_cart = TRUE
      ORDER BY updated_at DESC
      LIMIT 1
    `,
      [userId]
    );

    return carts.length > 0 ? carts[0] : null;
  }

  async validateCartItems(connection, cartId) {
    const [items] = await connection.execute(
      `
      SELECT oi.*, d.price as current_price
      FROM order_item oi
      JOIN dish d ON oi.item_id = d.item_id
      WHERE oi.order_id = ?
    `,
      [cartId]
    );

    let totalAmount = 0;
    const priceDiscrepancies = [];

    for (const item of items) {
      if (Math.abs(item.price - item.current_price) > 0.01) {
        priceDiscrepancies.push({
          item_id: item.item_id,
          cart_price: item.price,
          current_price: item.current_price,
        });
      }
      totalAmount += item.current_price * item.quantity;
    }

    if (priceDiscrepancies.length > 0) {
      await this.updateCartPrices(connection, cartId, items);

      const error = new Error(
        "Prices have changed since items were added to cart"
      );
      error.code = "PRICE_CHANGED";
      error.priceChanges = priceDiscrepancies;
      error.newTotal = totalAmount;
      throw error;
    }

    return { items, totalAmount };
  }

  async updateCartPrices(connection, cartId, items) {
    for (const item of items) {
      await connection.execute(
        `
        UPDATE order_items
        SET price = (SELECT price FROM dish WHERE item_id = ?)
        WHERE order_id = ? AND item_id = ?
      `,
        [item.item_id, cartId, item.item_id]
      );
    }

    const [totalResult] = await connection.execute(
      `
      SELECT COALESCE(SUM(price * quantity), 0) as total
      FROM order_items WHERE order_id = ?
    `,
      [cartId]
    );

    await connection.execute(
      `
      UPDATE orders SET total_price = ? WHERE order_id = ?
    `,
      [totalResult[0].total, cartId]
    );
  }

  async createPayPalOrder(totalAmount, orderId, orderType) {
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: totalAmount.toFixed(2),
          },
          description: `Bean to Mug ${
            orderType === "guest" ? "Guest " : "customer"
          }Order #${orderId}`,
        },
      ],
    });

    const response = await paypalClient.execute(request);
    return response.result;
  }

  async convertCartToOrder(connection, orderId, paypalOrderId, totalAmount) {
    await connection.execute(
      `
      UPDATE orders
      SET is_cart = FALSE,
          status = 'pending',
          paypal_order_id = ?,
          total_price = ?,
          updated_at = NOW()
      WHERE order_id = ?
    `,
      [paypalOrderId, totalAmount, orderId]
    );
  }

  async findPendingOrder(connection, paypalOrderId) {
    const [orders] = await connection.execute(
      `
      SELECT * FROM orders
      WHERE paypal_order_id = ? AND status = 'pending' AND is_cart = FALSE
    `,
      [paypalOrderId]
    );
    return orders.length > 0 ? orders[0] : null;
  }

  async markOrderCompleted(connection, orderId) {
    await connection.execute(
      `
      UPDATE orders
      SET status = 'completed', updated_at = NOW()
      WHERE order_id = ?
    `,
      [orderId]
    );
  }

  async revertOrderToCart(connection, orderId) {
    await connection.execute(
      `
      UPDATE orders
      SET is_cart = TRUE,
          status = NULL,
          paypal_order_id = NULL,
          updated_at = NOW()
      WHERE id = ?
    `,
      [orderId]
    );
  }

  async deleteGuestOrder(connection, orderId) {
    await connection.execute(
      `
      DELETE FROM order_item WHERE order_id = ?
    `,
      [orderId]
    );
    await connection.execute(
      `
      DELETE FROM orders WHERE order_id = ?
    `,
      [orderId]
    );
  }
}

module.exports = new PayPalService();
