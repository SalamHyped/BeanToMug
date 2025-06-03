# 🏗️ Bean to Mug - Backend Architecture

## 📁 File Organization

The backend has been organized into a modular, service-oriented architecture for better maintainability and scalability.

```
Node_BE/
├── services/           # Business logic services
│   ├── paypalService.js    # PayPal API integration & order processing
│   └── cartService.js      # Cart operations (guest & user carts)
├── Routes/             # API route handlers
│   ├── paypal.js           # PayPal payment endpoints
│   ├── cart.js             # Cart management endpoints
│   └── user.js             # User authentication & registration
├── utils/              # Utility functions
│   └── cartMigration.js    # Session-to-user cart migration
├── cart_orders_schema.sql  # Database schema
├── paypalClient.js         # PayPal SDK configuration
└── README_PAYPAL_SETUP.md  # PayPal setup guide
```

## 🔧 Services Layer

### PayPal Service (`services/paypalService.js`)
Handles all PayPal-related business logic:
- **Cart to Order Conversion**: Validates cart items and creates PayPal orders
- **Payment Processing**: Captures payments and updates order status
- **Order Management**: Handles cancellations and reversions
- **Price Validation**: Ensures security by validating against database prices
- **Error Handling**: Comprehensive error recovery and rollback

**Key Methods:**
```javascript
createOrderFromCart(userId)     // Convert user cart to PayPal order
completePayment(orderId)        // Capture payment and finalize order
cancelOrder(orderId)            // Cancel and revert to cart
getOrderHistory(userId)         // Get user's order history
```

### Cart Service (`services/cartService.js`)
Manages cart operations for both guests and users:
- **Dual Storage**: Session carts for guests, database carts for users
- **Seamless Migration**: Auto-migrate guest carts on login/registration
- **Price Synchronization**: Always uses current database prices
- **Options Support**: Handles item customizations and variations

**Key Methods:**
```javascript
getCart(userId, sessionCart)           // Get cart (guest or user)
addToCart(userId, sessionCart, item)   // Add item to cart
updateQuantity(userId, sessionCart)    // Update item quantities
removeFromCart(userId, sessionCart)    // Remove items
migrateSessionToUser(userId, cart)     // Migrate guest cart to user
```

## 🛣️ Routes Layer

### PayPal Routes (`Routes/paypal.js`)
**Simplified and focused** - delegates all business logic to PayPalService:

```javascript
POST /api/paypal/create-paypal-order   // Create order from cart
POST /api/paypal/complete-payment      // Complete payment capture
POST /api/paypal/cancel-order          // Cancel and revert order
GET  /api/paypal/order-history         // Get user order history
```

### Cart Routes (`Routes/cart.js`)
**Unified cart management** - works seamlessly for guests and users:

```javascript
GET    /api/cart/           // Get cart items
POST   /api/cart/add        // Add item to cart
PUT    /api/cart/update     // Update item quantity
DELETE /api/cart/remove     // Remove item from cart
DELETE /api/cart/clear      // Clear entire cart
GET    /api/cart/count      // Get cart item count
```

### User Routes (`Routes/user.js`)
**Enhanced with cart migration**:

```javascript
POST /api/user/login       // Login with automatic cart migration
POST /api/user/register    // Register with cart migration
POST /api/user/logout      // Logout (preserves guest cart)
GET  /api/user/me          // Get current user info
```

## 🗄️ Database Schema

### Orders Table (Boolean-based Cart System)
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,                    -- NULL for guest orders
  is_cart BOOLEAN DEFAULT FALSE,  -- TRUE = active cart, FALSE = order
  status ENUM('pending', 'completed', 'failed', 'refunded') NULL,
  paypal_order_id VARCHAR(255),
  total_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Cart Logic:**
- `is_cart = TRUE` → Active shopping cart
- `is_cart = FALSE` → Completed or pending order
- `status` field only applies to orders (`is_cart = FALSE`)

### Order Items Table
```sql
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT,
  item_id INT,
  quantity INT,
  price DECIMAL(8,2),             -- Price when added (prevents manipulation)
  item_options JSON,              -- Item customizations
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Cart Migration Flow

### Guest to User Cart Migration
When a user logs in or registers:

1. **Get Session Cart**: Retrieve `req.session.cart` array
2. **Find/Create User Cart**: Get existing database cart or create new one
3. **Merge Items**: Combine session items with database items
4. **Update Database**: Save merged cart to database
5. **Update Session**: Replace session cart with merged result

```javascript
// Automatic migration on login/register
const migrationResult = await cartService.migrateSessionToUser(userId, sessionCart);
req.session.cart = migrationResult.cartItems;
```

## 🔐 Security Features

### Price Validation
- **Server-side Price Checking**: Always validates against current database prices
- **Price Change Detection**: Alerts users when prices change during checkout
- **Rollback on Error**: Reverts orders to cart if payment fails

### Session Management
- **Secure Sessions**: Express sessions with proper configuration
- **Guest Support**: No localStorage dependency - all server-side
- **Cross-session Persistence**: Carts survive browser restarts

### PayPal Integration
- **Hybrid Approach**: SDK for UX + server validation for security
- **Transaction Integrity**: Database transactions with rollback support
- **Order Tracking**: Complete audit trail from cart to completion

## 🚀 Deployment Considerations

### Environment Variables
```bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
NODE_ENV=production

# Database Configuration
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Session Configuration
SESSION_SECRET=your_session_secret
```

### Production Setup
1. **PayPal Environment**: Switch to `Environment.Production`
2. **HTTPS Required**: PayPal requires HTTPS in production
3. **Database Optimization**: Add indexes for performance
4. **Session Store**: Use Redis or database session store
5. **Error Monitoring**: Implement comprehensive logging

## 🎯 Benefits of This Architecture

### Modularity
- **Separation of Concerns**: Routes handle HTTP, services handle business logic
- **Reusable Services**: Services can be used across different routes
- **Easy Testing**: Mock services for unit testing

### Maintainability
- **Clear Organization**: Easy to find and modify specific functionality
- **Error Boundaries**: Errors contained within service layers
- **Documentation**: Self-documenting code structure

### Scalability
- **Service Extraction**: Services can be extracted to microservices later
- **Load Balancing**: Stateless design supports horizontal scaling
- **Caching**: Easy to add caching layers around services

### Security
- **Input Validation**: Centralized validation in services
- **Transaction Safety**: Database transactions prevent data corruption
- **Price Integrity**: Server-side price validation prevents manipulation

## 🔍 Troubleshooting

### Common Issues

**Cart Not Persisting:**
- Check session configuration
- Verify database cart creation
- Ensure user ID in session

**Payment Failures:**
- Verify PayPal credentials
- Check price validation errors
- Review transaction rollback logs

**Migration Issues:**
- Check cart migration service logs
- Verify session cart format
- Test with different user scenarios

### Debug Endpoints
```javascript
// Add these for debugging (remove in production)
GET /api/debug/session    // View current session
GET /api/debug/cart       // View cart state
GET /api/debug/orders     // View orders table
```

---

**Last Updated:** December 2024  
**Architecture Version:** 2.0  
**Status:** Production Ready ✅ 