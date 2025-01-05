// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');

// CREATE an order
exports.createOrder = async (req, res) => {
  try {
    // items = [{ productId, quantity, price }, ...]
    const { items, pickupNotes } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    let totalPrice = 0;

    // Build order items array with actual product references
    const orderItems = [];
    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }
      // optional: check stock, etc.
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: item.price
      });
      totalPrice += item.price * item.quantity;
    }

    const order = new Order({
      user: req.user ? req.user._id : null,
      items: orderItems,
      totalPrice,
      paymentStatus: 'Pending',
      pickupStatus: 'Not Ready',
      pickupNotes: pickupNotes || ''
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET all orders (admin only)
exports.getAllOrders = async (req, res) => {
  try {
    // fetch user info & product details
    const orders = await Order.find().populate('user', 'name email').populate('items.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET current user's orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE order pickup status (admin only)
exports.updatePickupStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // e.g. 'Ready', 'Completed'

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.pickupStatus = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// (Optional) UPDATE payment status after a successful payment
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body; // 'Paid', 'Failed', etc.

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus = paymentStatus;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
