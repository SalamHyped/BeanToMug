const express = require('express');

const router = express.Router();


router.get('/',async (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
    
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

router.put('/update-quantity', async(req, res) => {
  const { itemId, quantity, options } = req.body;
  
  if (!req.session.cart) {
    req.session.cart = [];
  }

  const cart = req.session.cart;
  const index = cart.findIndex(
    (i) => i.id === itemId && JSON.stringify(i.options) === JSON.stringify(options)
  );

  if (index >= 0) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }
    req.session.cart = cart;
    console.log('Updated cart quantity:', req.session.cart);
    res.json(cart);
  } else {
    res.status(404).json({ error: 'Item not found in cart' });
  }
});

router.delete('/remove', async(req, res) => {
  const { itemId, options } = req.body;
  
  if (!req.session.cart) {
    req.session.cart = [];
  }

  const cart = req.session.cart;
  const index = cart.findIndex(
    (i) => i.id === itemId && JSON.stringify(i.options) === JSON.stringify(options)
  );

  if (index >= 0) {
    cart.splice(index, 1);
    req.session.cart = cart;
    console.log('Removed item from cart:', req.session.cart);
    res.json(cart);
  } else {
    res.status(404).json({ error: 'Item not found in cart' });
  }
});


module.exports = router;