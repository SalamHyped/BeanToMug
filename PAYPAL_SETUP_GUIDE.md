# PayPal Integration Setup Guide

## 🚀 Complete PayPal Setup Instructions

### 1. Get PayPal Developer Credentials

1. **Go to PayPal Developer Portal:**
   - Visit: https://developer.paypal.com/
   - Log in or create a PayPal developer account

2. **Create a New App:**
   - Click "Create App" 
   - Choose "Default Application"
   - Select "Sandbox" for testing
   - Get your **Client ID** and **Client Secret**

### 2. Backend Environment Setup

Create `Node_BE/.env` file with:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=beantomug

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here

# Environment
NODE_ENV=development

# Session Configuration
SESSION_SECRET=your_secure_random_string_here

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Environment Setup

Create `beantomug/.env` file with:

```env
# PayPal Client ID (same as backend)
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id_here

# API Configuration
VITE_API_URL=http://localhost:8801

# Environment
VITE_NODE_ENV=development
```

### 4. Update HTML PayPal Script

Replace the PayPal script in `beantomug/index.html`:

```html
<!-- For development (sandbox) -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD&intent=capture&enable-funding=venmo,card"></script>

<!-- For production -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD&intent=capture"></script>
```

### 5. Database Setup

Run the database schema from `Node_BE/database_schema.sql`:

```sql
-- Create the required tables
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    paypal_order_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    customer_email VARCHAR(255),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    item_options JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

### 6. Testing the Integration

1. **Start Backend:**
   ```bash
   cd Node_BE
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd beantomug
   npm run dev
   ```

3. **Test PayPal Flow:**
   - Add items to cart
   - Click PayPal button
   - Use PayPal sandbox account to test payment
   - Verify order appears in database

### 7. PayPal Sandbox Test Accounts

Create test accounts in PayPal Developer Portal:
- **Business Account:** For receiving payments
- **Personal Account:** For making test payments

### 8. Production Deployment

For production:

1. **Change PayPal URLs:**
   - Replace `sandbox.paypal.com` with `paypal.com`
   - Use production client ID/secret

2. **Update Environment:**
   ```env
   NODE_ENV=production
   PAYPAL_CLIENT_ID=production_client_id
   PAYPAL_CLIENT_SECRET=production_client_secret
   ```

3. **SSL Certificate:**
   - PayPal requires HTTPS in production
   - Configure SSL/TLS certificates

### 9. Security Checklist

✅ **Server-side validation** - All prices validated against database  
✅ **Environment variables** - No hardcoded credentials  
✅ **HTTPS in production** - Required by PayPal  
✅ **Session security** - Secure session configuration  
✅ **Error handling** - Proper error responses  

### 10. Troubleshooting

**Common Issues:**

1. **"PayPal SDK not loaded"**
   - Check client ID in HTML script
   - Verify internet connection

2. **"Order creation failed"**
   - Check backend environment variables
   - Verify database connection

3. **"Payment capture failed"**
   - Check PayPal credentials
   - Verify order exists in database

4. **CORS Errors**
   - Update FRONTEND_URL in backend .env
   - Check CORS configuration

### 🎯 You're All Set!

Your PayPal integration now has:
- ✅ Secure server-side processing
- ✅ Smooth client-side UX
- ✅ Professional PayPal UI
- ✅ Complete order tracking
- ✅ Error handling & recovery

Test with PayPal sandbox first, then deploy to production! 🚀 