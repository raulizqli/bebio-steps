import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { initializeFirebase, startNotificationScheduler } from './services/notificationService';

import authRoutes from './routes/auth';
import babyRoutes from './routes/babies';
import sharingRoutes from './routes/sharing';
import feedingRoutes from './routes/feedings';
import sleepRoutes from './routes/sleep';
import healthRoutes from './routes/health';
import moodRoutes from './routes/mood';
import goalRoutes from './routes/goals';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bebio Steps API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/babies', babyRoutes);
app.use('/api/sharing', sharingRoutes);
app.use('/api/feedings', feedingRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/goals', goalRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const startServer = async () => {
  try {
    await connectDatabase();
    
    initializeFirebase();
    startNotificationScheduler();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
