// Name :salam shibli 
//Name : Razi Kaabyia
const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const server = http.createServer(app);
const port = 8801;
const cors = require('cors');
const session = require('express-session');
const { dbMiddleware } = require('./dbSingleton');
const socketService = require('./services/socketService');

// Initialize Socket.IO
socketService.initialize(server);

const menuRouter = require('./Routes/menu');
const cartRouter = require('./Routes/cart');
const authRouter = require('./Routes/auth');
const userRouter = require('./Routes/user');
const paypalRouter = require('./Routes/paypal');
const ratingsRouter = require('./Routes/ratings');
const ordersRouter = require('./Routes/orders');
const tasksRouter = require('./Routes/tasks');
const galleryRouter = require('./Routes/gallery');

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:8080'],  // Allow more ports
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Session configuration - improved for development
app.use(session({
    secret: 'salam',
    resave: false,  // Changed to false - only save if session was modified
    saveUninitialized: false,  // Changed to false - don't save uninitialized sessions
    cookie: { 
        secure: false,         // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000,  // 24 hours
        httpOnly: true,        // Prevents client-side access to the cookie
        sameSite: 'lax'       // Protects against CSRF
    }
}));

// Add session debugging middleware
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    next();
});

app.use(dbMiddleware);

// Add socket service to request object for use in routes (MOVE THIS BEFORE ROUTES)
app.use((req, res, next) => {
    req.socketService = socketService;
    next();
});

// Test route to verify server is running
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Server is running!', 
        timestamp: new Date().toISOString(),
        socketConnections: socketService.getConnectedUsersCount()
    });
});

// Test notification endpoint for debugging
app.post('/test-notification', (req, res) => {
    try {
        const { type, message } = req.body;
        
        // Emit test notification to all connected users
        socketService.emitNotification({
            targetRole: 'staff',
            message: message || 'Test notification from server',
            type: type || 'test'
        });
        
        // Also emit to admin room
        socketService.emitNotification({
            targetRole: 'admin',
            message: message || 'Test notification from server',
            type: type || 'test'
        });
        
        res.json({
            success: true,
            message: 'Test notification sent',
            timestamp: new Date().toISOString(),
            connectedUsers: socketService.getConnectedUsersCount()
        });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test notification',
            error: error.message
        });
    }
});

// Routes
app.use('/menu', menuRouter);
app.use('/cart', cartRouter);
app.use('/auth', authRouter);  // Auth routes mounted at root path
app.use('/user', userRouter);  // User routes for profile management
app.use('/paypal', paypalRouter);
app.use('/ratings', ratingsRouter);
app.use('/orders', ordersRouter);
app.use('/tasks', tasksRouter);  // Task management routes
app.use('/gallery', galleryRouter);  // Gallery routes

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`WebSocket server is ready for real-time connections`);
    console.log(`Test the server at: http://localhost:${port}/test`);
});
