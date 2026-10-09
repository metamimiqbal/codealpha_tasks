const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to format populated cart response
async function getPopulatedCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
async function getCart(req, res, next) {
  try {
    const cart = await getPopulatedCart(req.user._id);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

// @desc    Add item to cart or increment quantity
// @route   POST /api/cart
// @access  Private
async function addToCart(req, res, next) {
  try {
    const { productId, qty = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    const safeQty = Math.max(1, parseInt(qty, 10));

    if (existingIndex > -1) {
      cart.items[existingIndex].qty += safeQty;
    } else {
      cart.items.push({ product: productId, qty: safeQty });
    }

    await cart.save();
    const updated = await getPopulatedCart(req.user._id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
async function updateCartItem(req, res, next) {
  try {
    const { productId } = req.params;
    const { qty } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    const targetQty = parseInt(qty, 10);
    if (targetQty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].qty = targetQty;
    }

    await cart.save();
    const updated = await getPopulatedCart(req.user._id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// @desc    Clear all items in cart
// @route   DELETE /api/cart
// @access  Private
async function clearCart(req, res, next) {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared successfully', items: [] });
  } catch (err) {
    next(err);
  }
}

// @desc    Sync guest cart items to user cart on login
// @route   POST /api/cart/sync
// @access  Private
async function syncCart(req, res, next) {
  try {
    const { items = [] } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    for (const incoming of items) {
      const idx = cart.items.findIndex(
        i => i.product.toString() === (incoming.product?._id || incoming.product || incoming.productId)
      );
      const incomingId = incoming.product?._id || incoming.product || incoming.productId;
      if (idx > -1) {
        cart.items[idx].qty += incoming.qty || 1;
      } else if (incomingId) {
        cart.items.push({ product: incomingId, qty: incoming.qty || 1 });
      }
    }

    await cart.save();
    const updated = await getPopulatedCart(req.user._id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  clearCart,
  syncCart
};
