const express = require('express');
const router = express.Router();

/**
 * POST /ratings
 * Submits a rating for a completed order
 * 
 * This endpoint allows customers to rate their orders:
 * - Validates rating input (1-5 scale)
 * - Checks if the order exists and hasn't been rated yet
 * - Updates the order with the submitted rating
 * - Prevents duplicate ratings for the same order
 * 
 * The rating system uses a simple 1-5 star scale where:
 * - 1 = Very Poor
 * - 2 = Poor
 * - 3 = Average
 * - 4 = Good
 * - 5 = Excellent
 * 
 * Database Schema:
 * - Orders table has a 'rating' column (default 0 = not rated)
 * - Only orders with rating = 0 can be rated (prevents duplicate ratings)
 * 
 * Flow:
 * 1. Validate required input parameters
 * 2. Validate rating is within valid range (1-5)
 * 3. Check if order exists and is eligible for rating
 * 4. Update order with the new rating
 * 5. Return success response
 * 
 * Authentication: Not required (allows guest ratings)
 * Request Body: { orderId: number, rating: number }
 * Response: Success message or error details
 */
router.post('/', async (req, res) => {
  try {
    // Extract rating data from request body
    const { orderId, rating } = req.body;

    // Step 1: Validate that all required fields are provided
    // Both orderId and rating are mandatory for rating submission
    if (!orderId || !rating) {
      return res.status(400).json({ 
        error: 'Order ID and rating are required' 
      });
    }

    // Step 2: Validate rating is within the acceptable range
    // Rating must be a whole number between 1 and 5 (inclusive)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }

    // Step 3: Check if the order exists and is eligible for rating
    // This query ensures:
    // - The order exists in the database
    // - The order hasn't been rated yet (rating = 0)
    // - Prevents duplicate ratings for the same order
    const [orders] = await req.db.execute(
      'SELECT order_id FROM orders WHERE order_id = ? AND rating = 0',
      [orderId]
    );

    // If no order found or order already rated, return 404 error
    // This could happen if:
    // - The order ID doesn't exist
    // - The order has already been rated (rating > 0)
    // - The order is still pending (not yet completed)
    if (orders.length === 0) {
      return res.status(404).json({ 
        error: 'Order not found or already rated' 
      });
    }

    // Step 4: Update the order with the submitted rating
    // This permanently stores the rating in the database
    // The rating cannot be changed once submitted (prevents rating manipulation)
    await req.db.execute(
      'UPDATE orders SET rating = ? WHERE order_id = ?',
      [rating, orderId]
    );

    // Step 5: Return success response
    // The rating has been successfully recorded
    res.json({ 
      success: true, 
      message: 'Rating submitted successfully' 
    });
    
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error submitting rating:', error);
    
    // Return generic error message to client
    // In production, you might want to log more details but not expose them
    res.status(500).json({ 
      error: 'Failed to submit rating' 
    });
  }
});

module.exports = router; 