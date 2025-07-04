# Vonage Sandbox Testing Setup

## Getting Test Credentials

### Step 1: Access Vonage Sandbox
1. Go to [Vonage Dashboard](https://dashboard.nexmo.com/)
2. Sign in to your account
3. Look for **"Sandbox"** or **"Test Credentials"** section

### Step 2: Get Sandbox Credentials
1. In the dashboard, find **"API Credentials"** or **"Sandbox"**
2. Copy your **Sandbox API Key** and **Sandbox API Secret**
3. These are different from your production credentials

### Step 3: Update Environment Variables
Create or update your `.env` file in the `Node_BE` directory:

```env
# Vonage Sandbox Test Credentials
VONAGE_API_KEY=your_sandbox_api_key_here
VONAGE_API_SECRET=your_sandbox_api_secret_here
VONAGE_FROM_NUMBER=Vonage APIs
```

### Step 4: Sandbox Limitations
- **Only works with verified numbers** in your sandbox
- **No real SMS delivery** - messages are logged in dashboard
- **Perfect for development and testing**
- **No charges** for sandbox usage

## Testing Your Application

### Step 1: Verify Your Number in Sandbox
1. Go to Vonage Dashboard → Sandbox
2. Add your phone number: `+972525881614`
3. Verify it through the sandbox interface

### Step 2: Test SMS Functionality
1. Start your backend: `npm start` (in Node_BE)
2. Start your React app: `npm start` (in beantomug)
3. Test SMS verification in your app
4. Check Vonage Dashboard for message logs

### Step 3: Check Message Logs
- Go to Vonage Dashboard → Sandbox
- Look for **"Message Logs"** or **"SMS Logs"**
- You'll see the messages that would have been sent
- No actual SMS will be delivered to your phone

## Benefits of Sandbox Testing
- ✅ No charges or credits needed
- ✅ Perfect for development
- ✅ All API functionality available
- ✅ Message logging for debugging
- ✅ Safe testing environment

## Switching to Production
When ready for production:
1. Get real Vonage credentials
2. Update environment variables
3. Add credits to your account
4. Test with real phone numbers 