const express = require('express');
const router = express.Router();


// Submit a rating for an order
router.post('/', async (req, res) => {
  try {
    const { orderId, rating } = req.body;

    // Validate input
    if (!orderId || !rating) {
      return res.status(400).json({ error: 'Order ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if order exists and hasn't been rated yet
    const [orders] = await req.db.execute(
      'SELECT order_id FROM orders WHERE order_id = ? AND rating = 0',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found or already rated' });
    }

    // Update order with rating
    await req.db.execute(
      'UPDATE orders SET rating = ? WHERE order_id = ?',
      [rating, orderId]
    );

    res.json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router; 