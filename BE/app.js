const express = require('express');
const app = express();
const port = 8801;
const cors = require('cors');
const session = require('express-session');
app.use(express.json());
const menuRouter = require('./Routes/menu.js');
const cartRouter = require('./Routes/cart.js');
const dbMiddleware = require('./dbSingleton.js').dbMiddleware

app.use(cors({
  origin: 'http://localhost:5173', // frontend URL
  credentials: true               // 🔥 this is essential for cookies!
}));
app.use(session({
    secret: 'salam',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false ,maxAge:600000} // For HTTPS use true
}));

app.use(dbMiddleware);
app.use('/menu', menuRouter);
app.use('/cart', cartRouter);


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
  
