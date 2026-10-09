const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be positive']
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      index: true
    },
    brand: {
      type: String,
      default: 'Aura',
      trim: true
    },
    imageUrl: {
      type: String,
      required: [true, 'Product image URL is required'],
      default: '/images/default-product.svg'
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5
    },
    numReviews: {
      type: Number,
      default: 0
    },
    countInStock: {
      type: Number,
      required: [true, 'Stock count is required'],
      default: 10,
      min: [0, 'Stock cannot be negative']
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
