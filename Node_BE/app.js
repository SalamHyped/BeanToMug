// Name :salam shibli 
//Name : Razi Kaabyia
const express = require('express');
const path = require('path');
const app = express();
const port = 8801;
const cors = require('cors');
const session = require('express-session');
const { dbMiddleware } = require('./dbSingleton');
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
    origin: ['http://localhost:5173', 'http://localhost:5174'],  // Allow both ports
    credentials: true
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
