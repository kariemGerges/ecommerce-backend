E-commerce API
This repository contains a secure Node.js/Express back-end for an e-commerce application. The API supports:

User authentication (registration, login, logout) using JWT
Role-based access control (admin vs. regular user)
Product management (create, read, update, delete)
Order management (create orders, update pickup/payment status)
Security enhancements including:
Helmet (secure HTTP headers, HSTS)
express-rate-limit (rate limiting)
Redis-based token blacklist (logout functionality)
Token rotation (short-lived access tokens + refresh tokens)
CSRF protection (if using cookies)
This API can be used alongside a front-end (e.g., React) to build a full-featured, secure e-commerce web application.

Table of Contents
Features
Project Structure
Installation and Configuration
Environment Variables
Scripts
Security Features
API Endpoints Overview
Token Blacklisting & Logout Flow
Token Rotation (Refresh Tokens)
CSRF Protection (Cookie-based)
Rate Limiting
Deployment Tips
License
Features
User: register, login, logout, get profile
Admin: product CRUD, view all orders, update pickup/payment statuses
Order: create new order (with local pickup or shipping), view user’s orders
JWT Authentication:
Access tokens (short-lived)
Optional refresh tokens (longer-lived)
Redis integration:
Token blacklisting (on logout)
Session store (if desired)
Project Structure
A typical file/folder layout might look like:

bash
Copy code
.
├── config/
│   └── db.js                    # Database connection (MongoDB)
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   └── orderController.js
├── middlewares/
│   └── authMiddleware.js        # JWT & admin checks
├── models/
│   ├── User.js
│   ├── Product.js
│   └── Order.js
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   └── orderRoutes.js
├── utils/
│   ├── tokenBlacklist.js        # Redis-based token blacklisting helpers
│   └── errorHandler.js          # Optional advanced error handling
├── .env                         # Environment variables
├── package.json
└── server.js                    # Express app entry point
Installation and Configuration
Clone the repository

bash
Copy code
git clone https://github.com/your-username/ecommerce-api-secure.git
cd ecommerce-api-secure
Install Dependencies

bash
Copy code
npm install
Set up your .env file (see Environment Variables).

Run MongoDB and Redis (locally or via Docker).

Start the server (development mode)

bash
Copy code
npm run dev
Environment Variables
Create a .env file in the project root. Example:

makefile
Copy code
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce_db

# JWT
JWT_SECRET=supersecretjwtkey

# Refresh tokens (optional)
REFRESH_TOKEN_SECRET=anothersecretkey

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Sessions (if using express-session)
SESSION_SECRET=some-random-secret

# CSRF Toggle
USE_CSRF=false
Required keys:

MONGO_URI: MongoDB connection string
JWT_SECRET: Secret key for signing access tokens
PORT: The port your server runs on
Recommended:

REFRESH_TOKEN_SECRET: Secret key for refresh token if you use token rotation
USE_CSRF: true or false if you want to enable/disable CSRF protection
Scripts
npm run dev: Runs the server in development mode using nodemon.
npm run start: Runs the server in production mode (Node).
Security Features
Helmet: Adds various HTTP security headers.
Rate Limiting: Prevents abuse by limiting requests per IP over a time window.
Redis-based Token Blacklist: Allows tokens to be invalidated on logout.
Token Rotation: Uses refresh tokens for renewing short-lived access tokens.
CSRF Protection (optional): If you store tokens in cookies, csurf can protect against cross-site request forgery.
HTTPS (Recommended in production): Always run behind SSL/TLS in production.
API Endpoints Overview
Below is a brief overview. For a full list, see the route files in routes/.

Auth Routes
POST /api/auth/register

Request Body: { name, email, password }
Response: user info + accessToken (and optional refresh token as cookie)
POST /api/auth/login

Request Body: { email, password }
Response: user info + accessToken (and optional refresh token as cookie)
POST /api/auth/logout

Headers: Authorization: Bearer <accessToken>
Action: Blacklists the active token in Redis
GET /api/auth/profile (Protected)

Headers: Authorization: Bearer <accessToken>
Response: current user’s info (excluding password)
POST /api/auth/refresh (Optional if using Refresh Tokens)

Cookies: refreshToken
Response: new accessToken
Product Routes
GET /api/products (Public)
GET /api/products/:id (Public)
POST /api/products (Admin Only)
PUT /api/products/:id (Admin Only)
DELETE /api/products/:id (Admin Only)
Order Routes
POST /api/orders (User must be logged in)
Body: array of items, pickup instructions, etc.
GET /api/orders/myorders (User must be logged in)
GET /api/orders (Admin Only: all orders)
PATCH /api/orders/:orderId/pickup-status (Admin Only)
PATCH /api/orders/:orderId/payment-status (Admin Only)
Token Blacklisting & Logout Flow
When a user logs out:

We decode the access token to get its expiration time (exp).
We store the token in Redis with an expiration matching its remaining lifetime.
Subsequent requests with the blacklisted token are denied by the authMiddleware checking Redis.
Key Functions (utils/tokenBlacklist.js):

js
Copy code
// addTokenToBlacklist(token, expiresInSeconds)
// isTokenBlacklisted(token)
Token Rotation (Refresh Tokens)
Short-Lived Access Tokens (e.g., 15 minutes).
Refresh Token (e.g., 7 days) stored as an HttpOnly cookie.
When the Access Token expires, the client calls POST /api/auth/refresh sending the refresh token cookie.
The server validates the refresh token and issues a new Access Token.
This reduces the attack window if an Access Token is compromised.

CSRF Protection (Cookie-based)
If you store JWTs in cookies, CSRF becomes relevant. We use the csurf package:

Enable with USE_CSRF=true in .env.
A CSRF token is generated server-side and stored in a cookie (e.g., XSRF-TOKEN).
The client must send this token in a header (X-CSRF-Token) with each modifying request.
If the token doesn’t match the server’s, the request is blocked with a 403 error.
Rate Limiting
Using express-rate-limit:

js
Copy code
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // 100 requests per IP
  message: {
    success: false,
    message: 'Too many requests, try again later.'
  },
});
app.use(limiter);
This helps prevent brute-force attacks or denial of service from a single IP.

Deployment Tips
Use HTTPS (TLS/SSL) in production:
This ensures tokens/cookies aren’t exposed over unencrypted channels.
Set Secure and HttpOnly on cookies containing tokens:
cookie: { httpOnly: true, secure: true, ... }
Environment-Specific Config:
Have separate .env for dev/staging/prod with different secrets, DB URIs, rate-limit settings, etc.
Logging & Monitoring:
Use tools like Winston, Morgan, or services like Datadog/New Relic to monitor logs and performance.
License
MIT License — Feel free to modify and reuse this project for your own purposes.

Thank You!
Feel free to open an issue or make a pull request if you find a bug or want to contribute additional features. If you have any questions, don’t hesitate to reach out!