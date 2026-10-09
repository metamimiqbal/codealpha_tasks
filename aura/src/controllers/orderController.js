const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// @desc    Create new order & process checkout
// @route   POST /api/orders
// @access  Private
async function createOrder(req, res, next) {
  try {
    const { orderItems, shippingAddress, paymentMethod = 'Card' } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.country
    ) {
      return res.status(400).json({ message: 'Complete shipping address is required' });
    }

    // Verify products exist, verify pricing from database to prevent price tampering, and check stock
    const verifiedItems = [];
    let itemsPrice = 0;

    for (const item of orderItems) {
      const productId = item.product?._id || item.product || item.productId;
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name || productId}` });
      }

      const qty = parseInt(item.qty, 10) || 1;
      if (product.countInStock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.countInStock}`
        });
      }

      // Deduct inventory
      product.countInStock -= qty;
      await product.save();

      const itemTotal = Number((product.price * qty).toFixed(2));
      itemsPrice += itemTotal;

      verifiedItems.push({
        product: product._id,
        name: product.name,
        qty,
        price: product.price,
        imageUrl: product.imageUrl
      });
    }

    itemsPrice = Number(itemsPrice.toFixed(2));
    const shippingPrice = itemsPrice >= 100 ? 0.0 : 9.99;
    const taxPrice = Number((itemsPrice * 0.08).toFixed(2));
    const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

    const order = new Order({
      user: req.user._id,
      orderItems: verifiedItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid: true,
      paidAt: new Date(),
      status: 'Processing'
    });

    const createdOrder = await order.save();

    // Clear user's cart upon successful order placement
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json(createdOrder);
  } catch (err) {
    next(err);
  }
}

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Ensure only the order owner or admin can view
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
}

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
async function getAllOrders(req, res, next) {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status || order.status;
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};
