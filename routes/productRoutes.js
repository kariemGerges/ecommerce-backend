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
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Admin routes
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
