require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const babyRoutes = require('./routes/baby');
const feedingRoutes = require('./routes/feeding');
const sleepRoutes = require('./routes/sleep');
const mealRoutes = require('./routes/meal');
const illnessRoutes = require('./routes/illness');
const medicationRoutes = require('./routes/medication');
const moodRoutes = require('./routes/mood');
const shareRoutes = require('./routes/share');
const notificationRoutes = require('./routes/notification');
const alexaRoutes = require('./routes/alexa');

// Initialize cron jobs
require('./jobs/notificationJobs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/babies', babyRoutes);
app.use('/api/feeding', feedingRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/illness', illnessRoutes);
app.use('/api/medication', medicationRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/alexa', alexaRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Baby Tracker API running on http://localhost:${PORT}`);
});

module.exports = app;
