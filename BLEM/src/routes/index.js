const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const postRoutes = require('./postRoutes');
const commentRoutes = require('./commentRoutes');

const router = express.Router();

// System Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BLEM API server is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Modular Feature Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);

module.exports = router;
