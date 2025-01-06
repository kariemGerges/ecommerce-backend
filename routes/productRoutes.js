// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Public routes
// http://localhost:3000/products
router.get('/', getAllProducts);

// http://localhost:3000/products/677b1c1e24a3bcf7543c8f49
router.get('/:id', getProductById);

// Admin routes
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
