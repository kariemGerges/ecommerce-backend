require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const csurf = require("csurf");
const redis = require("redis");
const logger = require("morgan");
const connectDB = require("./config/db");
const sanitizeInput = require("./middlewares/sanitizeInput");
// Route files
const indexRouter = require("./routes/index");
const authRoutes = require("./routes/authRouter");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// https://ecommerce-backend-8xv8.onrender.com (backend)
// https://ecommerce-backend-8xv8.onrender.com/auth/login example

// Connect to DB
connectDB();

// 1) SANITIZE all incoming data requests
app.use(sanitizeInput);
// 2) SECURITY: HELMET (SECURE HEADERS + HSTS)
app.use(
  helmet({
    // If needed customize certain headers, goes here.
    // Example: to allow images from your own domain:
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        // etc...
      },
    },
    // Force HTTPS (HSTS) for maxTime = 60 days:
    hsts: {
      maxAge: 60 * 24 * 60 * 60, // 60 days in seconds
      includeSubDomains: true,
    },
  })
);

// 3) RATE LIMITING
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   // max: 200,                 // max requests per IP per windowMs
//   message: {
//     success: false,
//     message: "Too many requests from this IP, please try again later.",
//   },
// });
// app.use(limiter);

// middleware
// List your allowed origins
const allowedOrigins = [
  "https://ecommerce-frontend-qgyu.onrender.com",  // Production frontend (Render)
  "https://ecommerce-frontend-henna-two.vercel.app", // Production frontend (Vercel) customer website
  "https://ecommerce-frontend-admindashborad.vercel.app", // production frontend (vercel) admin dashboard
  "https://kariemgerges.github.io",                 // Production frontend (GitHub Pages)
  "http://localhost:3001",                           // Local development
  "http://localhost:3002",                           // Local development
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the incoming origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed by CORS policy`));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allows the backend to accept cookies and other credentials
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Length", "X-JSON"],
  optionsSuccessStatus: 204,
};

// Apply the CORS middleware before your routes
app.use(cors(corsOptions));


app.use(compression());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(morgan("dev"));

// Routes
app.use("/", indexRouter);
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/payment", paymentRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <h1>server error: ${err.message}</h1>
  </body>
  </html>`);
});

module.exports = app;
