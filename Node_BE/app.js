const express = require('express');
const app = express();
const port = 8801;
const cors = require('cors');
const session = require('express-session');
const { dbMiddleware } = require('./dbSingleton');
const menuRouter = require('./Routes/menu');
const cartRouter = require('./Routes/cart');
const authRouter = require('./Routes/auth');
const paypalRouter = require('./Routes/paypal');
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],  // Allow both ports
    credentials: true
}));

app.use(session({
    secret: 'salam',
    resave: false,
    saveUninitialized: false,  // Changed to false for better security
    cookie: { 
        secure: false,         // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000,  // 24 hours
        httpOnly: true,        // Prevents client-side access to the cookie
        sameSite: 'lax'       // Protects against CSRF
    }
}));

app.use(dbMiddleware);

// Routes
app.use('/menu', menuRouter);
app.use('/cart', cartRouter);
app.use('/auth', authRouter);  // Auth routes mounted at root path
app.use('/paypal', paypalRouter);
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
