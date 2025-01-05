// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect middleware:
 * 1) Checks for a valid Authorization header (Bearer token).
 * 2) Verifies the token with the configured secret and algorithm.
 * 3) Finds the corresponding user in the DB and attaches them to req.user.
 * 4) Ensures the user still exists and is active/allowed.
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check for an Authorization header with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else {
    return res.status(401).json({
      success: false,
      message: 'Authorization header missing or malformed',
    });
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided, authorization denied',
    });
  }

  try {
    // Verify token (optionally specify allowed algorithms for extra security)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // or whatever algorithm(s) you allow
    });

    // decoded should have at least { id, iat, exp }
    // Fetch the user, excluding password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: user not found',
      });
    }

    // (Optional) Check if user is disabled, banned, etc.
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'User is banned. Contact support.',
      });
    }

    // Attach user to the request object
    req.user = user;
    next();

  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired, please log in again',
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token, verification failed',
      });
    } else {
      // Catch-all for other errors
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token verification failed',
      });
    }
  }
};

/**
 * adminOnly middleware:
 * 1) Ensures req.user exists (i.e., protect middleware ran before).
 * 2) Checks user.isAdmin boolean.
 */
exports.adminOnly = (req, res, next) => {
  // If protect middleware hasn't run or user is missing,
  // the request is already unauthorized.
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no user attached to request',
    });
  }

  if (req.user.isAdmin) {
    return next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Admin privilege required',
    });
  }
};
