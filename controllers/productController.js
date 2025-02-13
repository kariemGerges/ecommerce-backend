const { default: queryString } = require("query-string");
const Product = require("../models/Product");
const { buildPriceRangeFilter } = require("../utils/priceRangeFilter");

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// fetch products by filers and pagination
exports.getFilteredProducts = async (req, res) => {
  try {

    // Express automatically populates req.query:
    const { category, brand, price, page = 1, limit = 12 } = req.query;

    // build the filter object
    const filter = {};
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      filter.category = { $in: categories };
    }
    if (brand) {
      const brands = Array.isArray(brand) ? brand : [brand];
      filter.brand = { $in: brands };
    }
    // build the price filter
    if (price) {
      const priceFilter = buildPriceRangeFilter(price);
      Object.assign(filter, priceFilter);
    }
    // pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // console.log("filter", filter);

    // fetch products
    const filteredProducts = await Product.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      products: filteredProducts,
      totalProducts,
      currentPage: parseInt(page),
      totalPages: totalPages,
      limit: parseInt(limit),
      pageSize: parseInt(limit),
      hasPreviousPage: parseInt(page) > 1,
      hasNextPage: parseInt(page) < totalPages,
      previousPage: parseInt(page) - 1,
      nextPage: parseInt(page) + 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.error("Error fetching filtered products", error);
  }
};

// Get paginated products 10 per page
exports.getProductsPaginated = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const filter = {};

  if (
    isNaN(pageNumber) ||
    isNaN(limitNumber || pageNumber < 1 || limitNumber < 1)
  ) {
    return res
      .status(400)
      .json({ message: "Invalid page or limit parameters" });
  }

  try {
    const products = await Product.countDocuments(filter);
    const totalPages = Math.ceil(products / limitNumber);
    const skip = (pageNumber - 1) * limitNumber;
    const productsPaginated = await Product.find(filter)
      .skip(skip)
      .limit(limitNumber);
    const hasNextPage = pageNumber * limitNumber < products;
    const hasPreviousPage = pageNumber > 1;

    res.json({
      products: productsPaginated,
      currentPage: pageNumber,
      totalPages: totalPages,
      limit: limitNumber,
      hasNextPage: hasNextPage,
      hasPreviousPage: hasPreviousPage,
    });
  } catch (error) {
    res.status(500).json({ errMessage: error.message });
  }
};

// get random products
exports.getRandomProducts = async (req, res) => {
  const { category } = req.query;
  const pipeline = [];

  if (category) {
    // Ensure category is an array even if a single value is provided.
    const categories = Array.isArray(category) ? category : [category];
    pipeline.push({
      $match: { category: { $in: categories } },
    });
  }

  // Randomly sample 3 documents from the filtered results.
  pipeline.push({
    $sample: { size: 3 },
  });

  try {
    const products = await Product.aggregate(pipeline);
    res.json(products);
  } catch (error) {
    res.status(500).json({ errMessage: error.message });
  }
};


// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
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
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      imageUrl,
      stock,
    });
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

    if (!product) return res.status(404).json({ message: "Product not found" });

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
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
