const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Security HTTP headers (disable strict CSP to allow embedded fonts and icons)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// Cross-Origin Resource Sharing
app.use(cors());

// Request logging (suppressed during tests for clean test output)
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// Database connection middleware for API routes (ensures connection in serverless like Vercel)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// API Routes
app.use('/api', apiRoutes);

// For unmatched /api calls, route to 404 handler
app.use('/api', notFound);

// SPA fallback: Send public/index.html for client-side navigation
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  if (req.method === 'GET' && req.accepts('html')) {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }
  next();
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
