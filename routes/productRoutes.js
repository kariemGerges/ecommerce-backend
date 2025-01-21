// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductsPaginated,
    getRandomProducts,
    getFilteredProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Public routes
// http://localhost:3000/products
router.get('/', getAllProducts);

// http://localhost:3000/products/random
router.get('/random', getRandomProducts);

// http://localhost:3000/products/paginated
router.get('/paginated', getProductsPaginated);

// filtered products
// http://localhost:3000/products/filtered?category=Toys&maxPrice=40
router.get('/filtered', getFilteredProducts);

// http://localhost:3000/products/677b1c1e24a3bcf7543c8f49
router.get('/:id', getProductById);

// Admin routes
// add product to database
router.post('/', protect, adminOnly, createProduct);
// update product by id
router.put('/:id', protect, adminOnly, updateProduct);
// delete product by id
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
