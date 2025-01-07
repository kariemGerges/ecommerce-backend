// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const bodyParser = require('body-parser');

/**
 * 1) Endpoint to create a Stripe Checkout Session
 *    This uses standard JSON parsing since the request
 *    body is small and not from Stripe.
 */
router.post('/create-checkout-session', express.json(), paymentController.createCheckoutSession);

/**
 * 2) Webhook endpoint to receive Stripe events
 *    Must use the raw body for Stripe signature verification.
 */
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), paymentController.stripeWebhook);

module.exports = router;
