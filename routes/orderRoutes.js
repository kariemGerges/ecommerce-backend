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

// Create order (user must be logged in)
// http://localhost:3000/orders (POST)
router.post('/', protect, createOrder);

// Get orders for the logged in user
// http://localhost:3000/orders/myorders (GET)
router.get('/myorders', protect, getMyOrders);

// Admin only: get all orders
// http://localhost:3000/orders (GET)
router.get('/', protect, adminOnly, getAllOrders);

// Admin only: update pickup status
// http://localhost:3000/orders/677b70aba8c7c7ee186e88d3/pickup-status (PATCH)
router.patch('/:orderId/pickup-status', protect, adminOnly, updatePickupStatus);

// Admin only (or via webhook): update payment status
router.patch('/:orderId/payment-status', protect, adminOnly, updatePaymentStatus);

module.exports = router;
