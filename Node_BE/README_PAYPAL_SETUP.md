# PayPal Integration Setup (Simplified for Coffee Shop)

## 1. Environment Variables

Create a `.env` file in the `Node_BE` directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=beantomug

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
NODE_ENV=development

# Session Secret
SESSION_SECRET=your_secure_session_secret_here
```

## 2. Get PayPal Credentials

1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Log in or create an account
3. Create a new app in the sandbox
4. Copy the Client ID and Client Secret
5. Replace the values in your `.env` file

## 3. Database Setup (Simplified)

Run the following SQL commands to set up the required tables:

```sql
-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  paypal_order_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  customer_email VARCHAR(255),
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_paypal_order_id (paypal_order_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  item_options JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES dish(item_id) ON DELETE RESTRICT,
  INDEX idx_order_id (order_id),
  INDEX idx_item_id (item_id)
);
```

**Note**: No inventory management tables needed since coffee shop inventory depends on ingredients rather than finished products.

## 4. Frontend PayPal SDK

Add this to your HTML `<head>` section:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>
```

Replace `YOUR_CLIENT_ID` with your actual PayPal client ID.

## 5. Testing

- Use PayPal sandbox credentials for testing
- Test with sandbox buyer accounts
- Monitor the console for any errors

## 6. Production

1. Change `NODE_ENV=production` in your `.env` file
2. Use production PayPal credentials
3. Update the PayPal SDK script to use production client ID

## Security Features Implemented

✅ **Server-side Order Creation**: Orders are created on your server, not in browser  
✅ **Price Validation**: Prices are validated against database, preventing manipulation  
✅ **Database Transactions**: Atomic operations ensure data consistency  
✅ **PayPal SDK**: Official SDK handles authentication and error handling  
✅ **Session Management**: Cart clearing and user session handling  
✅ **Order Tracking**: Complete order history and status tracking

## Perfect for Coffee Shops

This simplified version is ideal for coffee shops because:
- No complex inventory tracking needed
- Focuses on order processing and payment
- Ingredients can be managed separately
- Simple and reliable payment flow 