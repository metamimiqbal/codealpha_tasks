const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { seedData } = require('../src/utils/seed');
const Product = require('../src/models/Product');

describe('E-Commerce Site Backend API Test Suite', () => {
  let userToken = '';
  let adminToken = '';
  let testProductId = '';

  before(async () => {
    // Ensure in-memory or configured DB is connected and seeded
    process.env.NODE_ENV = 'test';
    await connectDB();
    await seedData();
  });

  after(async () => {
    await disconnectDB();
  });

  describe('1. Authentication API', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Wonder',
          email: 'alice@example.com',
          password: 'securePassword123'
        });

      assert.equal(res.status, 201);
      assert.ok(res.body.token);
      assert.equal(res.body.user.name, 'Alice Wonder');
      assert.equal(res.body.user.email, 'alice@example.com');
      assert.equal(res.body.user.password, undefined); // password must not be returned
    });

    it('should reject registration with already registered email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Duplicate',
          email: 'alice@example.com',
          password: 'securePassword123'
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /already exists/i);
    });

    it('should login demo customer and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@aurashop.com',
          password: 'password123'
        });

      assert.equal(res.status, 200);
      assert.ok(res.body.token);
      userToken = res.body.token;
      assert.equal(res.body.user.email, 'customer@aurashop.com');
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@aurashop.com',
          password: 'wrongpassword'
        });

      assert.equal(res.status, 401);
    });

    it('should retrieve user profile with valid auth token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.email, 'customer@aurashop.com');
    });

    it('should deny profile access without token', async () => {
      const res = await request(app).get('/api/auth/profile');
      assert.equal(res.status, 401);
    });
  });

  describe('2. Product Catalog API', () => {
    it('should fetch all products and pagination info', async () => {
      const res = await request(app).get('/api/products');

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.products));
      assert.ok(res.body.products.length > 0);
      assert.ok(res.body.total > 0);

      testProductId = res.body.products[0]._id;
    });

    it('should fetch distinct product categories', async () => {
      const res = await request(app).get('/api/products/categories/list');

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.includes('Audio'));
    });

    it('should fetch a single product by ID', async () => {
      const res = await request(app).get(`/api/products/${testProductId}`);

      assert.equal(res.status, 200);
      assert.equal(res.body._id, testProductId);
      assert.ok(res.body.price > 0);
      assert.ok(res.body.name);
    });

    it('should return 404 for a non-existent product ID', async () => {
      const res = await request(app).get('/api/products/600000000000000000000001');
      assert.equal(res.status, 404);
    });

    it('should filter products by category', async () => {
      const res = await request(app).get('/api/products?category=Audio');

      assert.equal(res.status, 200);
      res.body.products.forEach(p => {
        assert.equal(p.category, 'Audio');
      });
    });

    it('should search products by keyword', async () => {
      const res = await request(app).get('/api/products?keyword=Headphones');

      assert.equal(res.status, 200);
      assert.ok(res.body.products.length > 0);
      assert.match(res.body.products[0].name, /headphones/i);
    });
  });

  describe('3. Shopping Cart API', () => {
    it('should add an item to the shopping cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProductId,
          qty: 2
        });

      assert.equal(res.status, 200);
      assert.ok(res.body.items.length > 0);
      const added = res.body.items.find(i => (i.product._id || i.product) === testProductId);
      assert.ok(added);
      assert.equal(added.qty, 2);
    });

    it('should update cart item quantity', async () => {
      const res = await request(app)
        .put(`/api/cart/${testProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ qty: 3 });

      assert.equal(res.status, 200);
      const item = res.body.items.find(i => (i.product._id || i.product) === testProductId);
      assert.equal(item.qty, 3);
    });

    it('should fetch current user cart', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.items.length > 0);
    });
  });

  describe('4. Order Processing API', () => {
    it('should reject order if items array is empty', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderItems: [],
          shippingAddress: {
            fullName: 'Demo Customer',
            address: '123 Market St',
            city: 'San Francisco',
            postalCode: '94105',
            country: 'USA'
          }
        });

      assert.equal(res.status, 400);
    });

    it('should successfully create an order and decrement product stock', async () => {
      const productBefore = await Product.findById(testProductId);
      const initialStock = productBefore.countInStock;

      const orderPayload = {
        orderItems: [
          {
            product: testProductId,
            qty: 2
          }
        ],
        shippingAddress: {
          fullName: 'Demo Customer',
          address: '456 Tech Boulevard',
          city: 'Austin',
          postalCode: '78701',
          country: 'USA'
        },
        paymentMethod: 'Card'
      };

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderPayload);

      assert.equal(res.status, 201);
      assert.ok(res.body._id);
      assert.equal(res.body.orderItems.length, 1);
      assert.equal(res.body.status, 'Processing');
      assert.ok(res.body.totalPrice > 0);

      // Verify stock was reduced
      const productAfter = await Product.findById(testProductId);
      assert.equal(productAfter.countInStock, initialStock - 2);
    });

    it('should list all orders for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/orders/myorders')
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length >= 1);
    });
  });
});
