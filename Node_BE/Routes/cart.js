const express = require('express');

const router = express.Router();


router.get('/',async (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
    req.session.role = 'guest';
  }
  res.json(req.session.cart);
});

router.post('/add', async(req, res) => {
  const { item, quantity, options } = req.body;
  if (!req.session.cart) 
    req.session.cart = [];

  const cart = req.session.cart;
  const index = cart.findIndex(
    (i) => i.id === item.id && JSON.stringify(i.options) === JSON.stringify(options)
  );

  if (index >= 0) {
    cart[index].quantity += quantity;
  } else {
    cart.push({ ...item, quantity, options });
  }

  req.session.cart = cart;
    console.log('Updated cart:', req.session.cart);
  res.json(cart); // return updated cart
});


module.exports = router;