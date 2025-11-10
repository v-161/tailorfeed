// server/src/server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import notificationsRoutes from './routes/notifications.js';
import searchRoutes from './routes/search.js';
import aiRoutes from './routes/ai.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tailorfeed', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('📊 MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB connection disconnected');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TailorFeed Server is running!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// AI system status endpoint
app.get('/api/ai/status', (req, res) => {
  res.json({
    status: 'Active',
    message: 'Mr. Tailor AI system is running',
    endpoints: [
      'POST /api/ai/interaction - Track user interactions',
      'GET  /api/ai/recommendations - Get AI recommendations',
      'POST /api/ai/survey - Submit survey responses',
      'GET  /api/ai/interests - Get user interests'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TailorFeed Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local MongoDB'}`);
  console.log(`🤖 AI System: http://localhost:${PORT}/api/ai/status`);
});