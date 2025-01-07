// controllers/paymentController.js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

exports.createCheckoutSession = async (req, res) => {
    try {
    // 1. Get orderId from the request body
    const { orderId } = req.body;
    
    // 2. Fetch the order details from DB (including totalPrice, items, etc.)
    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // 3. Build line items array
    const lineItems = order.items.map(item => ({
      price_data: {
        currency: 'usd', // currency
        product_data: {
          name: item.productId.name, // e.g. "Baklava Pastry"
        },
        unit_amount: Math.round(item.price * 100), // amount in cents
      },
      quantity: item.quantity,
    }));

    // 4. Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:3000/checkout-success?session_id={CHECKOUT_SESSION_ID}&orderId=${order._id}`,
      cancel_url: `http://localhost:3000/checkout-cancel`,
      // Optional metadata
      metadata: {
        orderId: order._id.toString(),
        pickupDate: order.pickupDate?.toISOString() || '',
      }
    });

    // 5. Return the session URL to the client
    res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ message: 'Could not create checkout session' });
    }
};

/**
 *  STRIPE WEBHOOK
 *  -------------
 *  1) Stripe sends a POST request to /webhook after certain events.
 *  2) We verify the signature using our webhook secret.
 *  3) If valid, parse the event and handle e.g. "checkout.session.completed".
 */
exports.stripeWebhook = async (req, res) => {
    let event;
    const sig = req.headers['stripe-signature'];
  
    try {
      // 1) Verify the event came from Stripe
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook Error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    // 2) Event is verified; handle its type
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const orderId = session.metadata.orderId;
          
          // Mark the order as paid in the DB
          await Order.findByIdAndUpdate(orderId, { paymentStatus: 'Paid' });
          
          // Optionally send confirmation emails, etc.
          console.log(`Order ${orderId} has been paid.`);
          break;
        }
        // ... handle other event types if needed like change order status, etc.
  
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
  
      res.json({ received: true });
    } catch (err) {
      console.error('Error handling webhook event:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };