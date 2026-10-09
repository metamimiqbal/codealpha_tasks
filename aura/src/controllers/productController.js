const Product = require('../models/Product');

// @desc    Fetch all products with filtering, search, sorting & pagination
// @route   GET /api/products
// @access  Public
async function getProducts(req, res, next) {
  try {
    const { keyword, category, minPrice, maxPrice, sort, page = 1, limit = 24 } = req.query;

    const query = {};

    // Search keyword
    if (keyword && keyword.trim() !== '') {
      query.$or = [
        { name: { $regex: keyword.trim(), $options: 'i' } },
        { description: { $regex: keyword.trim(), $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'name') sortOption = { name: 1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort(sortOption)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);

    res.json({
      products,
      page: pageNum,
      pages: Math.ceil(total / pageSize) || 1,
      total
    });
  } catch (err) {
    next(err);
  }
}

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// @desc    Get all distinct product categories
// @route   GET /api/products/categories/list
// @access  Public
async function getCategories(req, res, next) {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
async function createProduct(req, res, next) {
  try {
    const product = new Product(req.body);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (err) {
    next(err);
  }
}

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product removed successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct
};
