// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  updatePickupStatus,
  updatePaymentStatus
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Create order (user must be logged in, or optionally allow guest checkout)
router.post('/', protect, createOrder);

// Get orders for the logged in user
router.get('/myorders', protect, getMyOrders);

// Admin only: get all orders
router.get('/', protect, adminOnly, getAllOrders);

// Admin only: update pickup status
router.patch('/:orderId/pickup-status', protect, adminOnly, updatePickupStatus);

// Admin only (or via webhook): update payment status
router.patch('/:orderId/payment-status', protect, adminOnly, updatePaymentStatus);

module.exports = router;
