const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  clearCart,
  syncCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/sync', syncCart);
router.put('/:productId', updateCartItem);
router.delete('/', clearCart);

module.exports = router;
