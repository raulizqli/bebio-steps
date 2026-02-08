require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { CronJob } = require('cron');
const { initializeDatabase } = require('./utils/database');
const { runDailyGoalCheck } = require('./services/notifications');

// Import routes
const authRoutes = require('./routes/auth');
const sharingRoutes = require('./routes/sharing');
const babyRoutes = require('./routes/babies');
const trackingRoutes = require('./routes/tracking');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BebIO Steps API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sharing', sharingRoutes);
app.use('/api/babies', babyRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Initialize database and start server
try {
  initializeDatabase();
  console.log('Database initialized successfully');

  // Schedule daily goal checks (run every 4 hours)
  const goalCheckJob = new CronJob('0 */4 * * *', () => {
    console.log('Running scheduled goal check...');
    runDailyGoalCheck();
  });
  goalCheckJob.start();

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`BebIO Steps API running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

module.exports = app;
