// server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const swapRoutes = require('./routes/swapRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('❌ MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

mongoose
  .connect(mongoURI, {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 50,
    retryWrites: true,
    retryReads: true,
  })
  .then(() => console.log('✅ MongoDB Connected to SkillSwap Database'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swap-requests', swapRoutes);
// app.use('/api/swap-requests', swapRoutes); 

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SkillSwap API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SkillSwap API!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      swaps: '/api/swaps',
      swapRequests: '/api/swap-requests',
      health: '/api/health',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SkillSwap Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
