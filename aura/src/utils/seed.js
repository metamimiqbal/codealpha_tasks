const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const Product = require('../models/Product');
const User = require('../models/User');

const demoUsers = [
  {
    name: 'Admin User',
    email: 'admin@aurashop.com',
    password: 'password123',
    role: 'admin'
  },
  {
    name: 'Demo Customer',
    email: 'customer@aurashop.com',
    password: 'password123',
    role: 'user'
  }
];

const demoProducts = [
  {
    name: 'Aura Sound Pro Wireless Headphones',
    description: 'Studio-grade spatial audio with active noise cancellation, 40-hour battery life, and ultra-plush memory foam earcups.',
    price: 249.99,
    category: 'Audio',
    brand: 'Aura Audio',
    imageUrl: '/images/headphones.svg',
    rating: 4.9,
    numReviews: 128,
    countInStock: 25,
    featured: true
  },
  {
    name: 'Nova Minimalist Mechanical Keyboard',
    description: 'Hot-swappable tactile switches housed in a CNC aluminum frame with customizable per-key RGB backlighting and PBT keycaps.',
    price: 139.00,
    category: 'Peripherals',
    brand: 'Nova Studio',
    imageUrl: '/images/keyboard.svg',
    rating: 4.8,
    numReviews: 94,
    countInStock: 15,
    featured: true
  },
  {
    name: 'Pulse Ultra Smartwatch Titanium',
    description: 'Sapphire crystal display, ECG monitoring, multisport GPS tracking, and 7-day battery endurance in an aerospace titanium case.',
    price: 329.50,
    category: 'Wearables',
    brand: 'Pulse Tech',
    imageUrl: '/images/smartwatch.svg',
    rating: 4.7,
    numReviews: 65,
    countInStock: 18,
    featured: true
  },
  {
    name: 'Lumen 4K Ergonomic Studio Monitor 27"',
    description: 'Factory-calibrated IPS panel with 99% DCI-P3 color gamut, 90W USB-C power delivery, and fully articulating stand.',
    price: 499.00,
    category: 'Displays',
    brand: 'Lumen Visuals',
    imageUrl: '/images/monitor.svg',
    rating: 4.9,
    numReviews: 43,
    countInStock: 10,
    featured: true
  },
  {
    name: 'Orbit Precision Wireless Mouse',
    description: 'Dual-mode ergonomic optical mouse with 26,000 DPI sensor, silent click dampeners, and seamless multi-device pairing.',
    price: 89.00,
    category: 'Peripherals',
    brand: 'Nova Studio',
    imageUrl: '/images/mouse.svg',
    rating: 4.6,
    numReviews: 112,
    countInStock: 40,
    featured: false
  },
  {
    name: 'Voxel Studio USB-C Microphone',
    description: 'Broadcast-quality condenser capsule with integrated shock mount, real-time headphone monitoring, and cardioid pickup pattern.',
    price: 179.99,
    category: 'Audio',
    brand: 'Voxel Sound',
    imageUrl: '/images/microphone.svg',
    rating: 4.8,
    numReviews: 56,
    countInStock: 14,
    featured: false
  },
  {
    name: 'Horizon MagSafe Fast Charging Stand',
    description: '3-in-1 weighted aluminum charging dock for smartphone, earbuds, and smartwatch with intelligent thermal regulation.',
    price: 69.99,
    category: 'Accessories',
    brand: 'Aura Gear',
    imageUrl: '/images/charger.svg',
    rating: 4.7,
    numReviews: 88,
    countInStock: 50,
    featured: false
  },
  {
    name: 'Aero Carbon Fiber Laptop Sleeve 14"',
    description: 'Weatherproof ballistic nylon shell lined with shock-absorbent micro-fleece and magnetic closure.',
    price: 45.00,
    category: 'Accessories',
    brand: 'Aero Case',
    imageUrl: '/images/sleeve.svg',
    rating: 4.5,
    numReviews: 37,
    countInStock: 30,
    featured: false
  }
];

async function seedData() {
  try {
    await connectDB();
    console.log('[Seed] Connected to database.');

    // Clear existing
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('[Seed] Cleared existing products and users.');

    // Insert Users (using loop so pre-save password hash hook executes)
    for (const u of demoUsers) {
      await User.create(u);
    }
    console.log('[Seed] Created demo users (admin@aurashop.com, customer@aurashop.com).');

    // Insert Products
    await Product.insertMany(demoProducts);
    console.log(`[Seed] Seeded ${demoProducts.length} demo products successfully.`);

    return true;
  } catch (err) {
    console.error('[Seed] Error seeding data:', err);
    throw err;
  }
}

// Execute directly if run as a CLI script
if (require.main === module) {
  seedData()
    .then(async () => {
      console.log('[Seed] Seeding completed.');
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed] Seeding failed:', err);
      await disconnectDB();
      process.exit(1);
    });
}

module.exports = {
  demoUsers,
  demoProducts,
  seedData
};
