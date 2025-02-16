// controllers/authController.js
const { validatePassword } = require("../utils/passwordValidationUtils");
const { isValidEmail } = require("../utils/emailValidationUtils");
const { isValidUSPhoneNumber } = require("../utils/phoneValidationUtils");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { token } = require("morgan");

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "60m" });
};

// Register new user
exports.registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    // Check if user already exists
    const userExists = await User.findOne({
      email: { $eq: email },
    });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password
    validatePassword(password);

    // Validate phone number
    if (!isValidUSPhoneNumber(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Create new user
    const user = await User.create({ name, email, phone, password });

    // Generate JWT token
    const token = generateToken(user._id);

    // Set JWT token as a cookie: token, httpOnly, secure
    res.cookie("authToken", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // it has to be none for production
      // sameSite: "lax", // for development
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      // token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// admin user
exports.adminUserLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid email or password or both." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Invalid email or password or both" });
    }

    if (!user.isAdmin) {
      return res.status(401).json({
        message:
          "Access denied you are not allowed to access the website please leave 🥰",
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Set JWT token as a cookie: token, httpOnly, secure
    res.cookie("authToken", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // it has to be none for production
      // sameSite: "lax", // for development
    });

    return res.status(200).json({
      message: `Welcome back ${user.name}!!!`,
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid email or password or both" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Invalid email or password or both" });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Set JWT token as a cookie: token, httpOnly, secure
    res.cookie("authToken", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // it has to be none for production
      // sameSite: "lax", // for development
    });

    // Return user data + JWT
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      // token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Logout user
exports.logoutUser = async (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });
    res.status(200).json({ message: "User logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get logged-in user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
