// controllers/orderController.js
const Order = require("../models/Order");
const Product = require("../models/Product");
const { sendOrderConfirmationEmail } = require("../utils/emailUtils");

// CREATE an order ==> eCommerce-client
exports.createOrder = async (req, res) => {
  try {
    // items item.productId);, quantity, price }, ...]
    const {
      items,
      pickupDate,
      pickupTime,
      paymentStatus,
      pickupStatus,
      customerComments,
      createdAt,
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    let totalPrice = 0;

    // Build order items array with actual product references
    const orderItems = [];
    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.productId}` });
      }
      // optional: check stock, etc.
      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: item.price,
      });
      totalPrice += item.price * item.quantity;
    }

    const order = new Order({
      user: req.user ? req.user._id : null,
      username: req.user ? req.user.name : "Guest",
      items: orderItems,
      totalPrice,
      pickupDate,
      pickupTime,
      paymentStatus,
      pickupStatus,
      customerComments,
      createdAt
    });

    const savedOrder = await order.save();

    // Send email confirmation
    const orderDetails = items.map((item) => ({
      name: item.productId.name,
      quantity: item.quantity,
      price: item.price,
    }));

    await sendOrderConfirmationEmail(
      req.user ? req.user.email : "",
      req.user ? req.user.name : "Guest",
      orderDetails
    );

    res.status(200).json(savedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET all orders (admin only) ==> eCommerce-admin
// http://localhost:3000/orders?status=Pending&startDate=2025-01-07&endDate=2025-01-30&page=1&limit=10 (GET)
exports.getAllOrders = async (req, res) => {
  try {
    // 1. Extract query parameters for filters and pagination
    let {
      page = 1, // current page number (default = 1)
      limit = 10, // items per page (default = 10)
      status, // e.g. pickupStatus filter: Pending | Ready | Completed
      userId, // filter by user ID
      startDate, // filter orders created after startDate
      endDate, // filter orders created before endDate
    } = req.query;

    // Ensure `page` and `limit` are numbers
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    // Validate `page` and `limit`
    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ message: "Invalid page or limit" });
    }

    // Validate `status`
    if (status && !["Pending", "Ready", "Processing" ,"Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Validate `userId`
    // if (userId && !/^[0-9a-fA-F]{24}$/.test(userId)) {
    //   return res.status(400).json({ message: "Invalid user ID" });
    // }

    // Validate `startDate` and `endDate`
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return res.status(400).json({ message: "Invalid start date format" });
    }
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return res.status(400).json({ message: "Invalid end date format" });
    }

    // 2. Build a dynamic filter object
    const filter = {};

    // Filter by pickup status (if provided)
    if (status) {
      filter.pickupStatus = status;
    }

    // Filter by user ID (if provided)
    if (userId) {
      filter.user = userId;
    }

    // Filter by date range (if both startDate and endDate provided)
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.createdAt = { $lte: new Date(endDate) };
    }

    // 3. Implement pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 4. Simultaneously:
    //    - Find filtered and paginated orders
    //    - Count total number of filtered documents for pagination
    //    - Aggregate stats (filtered)
    //    - Aggregate total items (filtered)
    const [orders, totalDocs, counts, totalItemsAgg] = await Promise.all([
      // (a) Filtered + paginated orders
      Order.find(filter)
        .populate("user", "name email")
        .populate("items.productId")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }), // e.g. sort newest first

      // (b) Count of all matching orders (for pagination metadata)
      Order.countDocuments(filter),

      // (c) Aggregation for stats (on the filtered set)
      Order.aggregate([
        { $match: filter }, // apply the same filter
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: {
                $cond: [{ $eq: ["$pickupStatus", "Pending"] }, 1, 0],
              },
            },
            ready: {
              $sum: {
                $cond: [{ $eq: ["$pickupStatus", "Ready"] }, 1, 0],
              },
            },
            completed: {
              $sum: {
                $cond: [{ $eq: ["$pickupStatus", "Completed"] }, 1, 0],
              },
            },
            cancelled: {
              $sum: {
                $cond: [{ $eq: ["$pickupStatus", "Cancelled"] }, 1, 0],
              },
            },
            processing: {
              $sum: {
                $cond: [{ $eq: ["$pickupStatus", "Processing"] }, 1, 0],
              },
            },
          },
        },
      ]),

      // (d) Aggregation for total items
      Order.aggregate([
        { $match: filter },
        { $unwind: "$items" },
        {
          $group: {
            _id: null,
            totalItems: { $sum: "$items.quantity" },
          },
        },
      ]),
    ]);

    // 5. Construct stats and total items result
    const stats = counts?.[0] || {
      total: 0,
      pending: 0,
      ready: 0,
      completed: 0,
    };
    const totalItems = totalItemsAgg?.[0]?.totalItems || 0;

    // 6. Calculate pagination info
    const totalPages = Math.ceil(totalDocs / parseInt(limit));

    // 7. Return response
    res.status(200).json({
      orders,
      totalOrders: stats.total,
      ordersPending: stats.pending,
      ordersReady: stats.ready,
      ordersCompleted: stats.completed,
      ordersCancelled: stats.cancelled,
      ordersProcessing: stats.processing,
      totalItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        limit: parseInt(limit),
        pageSize: parseInt(limit),
        hasPreviousPage: parseInt(page) > 1,
        hasNextPage: parseInt(page) < totalPages,
        previousPage: parseInt(page) - 1,
        nextPage: parseInt(page) + 1,
        
        totalDocs,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET current user's orders ==> eCommerce-client
// http://localhost:3000/orders/myorders (GET)
exports.getMyOrders = async (req, res) => {
  try {

    const orders = await Order.find({ user: req.user._id }).populate(
      "items.productId"
    );

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE order pickup status (admin only) ==> eCommerce-admin
exports.updatePickupStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // e.g. 'Ready', 'Completed'

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ message: "Order not found", error });

    order.pickupStatus = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// (Optional) UPDATE payment status after a successful payment ==> eCommerce-admin
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body; // 'Paid', 'Failed', etc.

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = paymentStatus;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
