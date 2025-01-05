const Product = require('../models/Product');

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CREATE a product (admin only)
exports.createProduct = async (req, res) => {
    try {
      const { name, description, price, category, imageUrl, stock } = req.body;
      const newProduct = new Product({ name, description, price, category, imageUrl, stock });
      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

// UPDATE a product (admin only)
exports.updateProduct = async (req, res) => {
    try {
      const { name, description, price, category, imageUrl, stock } = req.body;
      const product = await Product.findById(req.params.id);
  
      if (!product) return res.status(404).json({ message: 'Product not found' });
  
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.category = category || product.category;
      product.imageUrl = imageUrl || product.imageUrl;
      product.stock = stock ?? product.stock;
  
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

// Delete a product
exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};