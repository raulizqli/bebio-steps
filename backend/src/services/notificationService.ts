import * as admin from 'firebase-admin';
import cron from 'node-cron';
import Baby from '../models/Baby';
import Goal from '../models/Goal';
import Feeding from '../models/Feeding';
import Sleep from '../models/Sleep';

let firebaseInitialized = false;

export const initializeFirebase = () => {
  try {
    if (!firebaseInitialized && process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      firebaseInitialized = true;
      console.log('Firebase initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
};

export const sendNotification = async (
  deviceToken: string,
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  if (!firebaseInitialized) {
    console.log('Firebase not initialized, skipping notification');
    return;
  }

  try {
    await admin.messaging().send({
      token: deviceToken,
      notification: {
        title,
        body,
      },
      data,
    });
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};

const checkDailyGoals = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const babies = await Baby.find().populate('parents');

    for (const baby of babies) {
      const goals = await Goal.find({ baby: baby._id, isActive: true, period: 'daily' });

      for (const goal of goals) {
        if (goal.type === 'feeding') {
          const feedings = await Feeding.find({
            baby: baby._id,
            startTime: { $gte: today, $lt: tomorrow },
          });

          const totalAmount = feedings.reduce((sum, f) => sum + (f.amount || 0), 0);

          if (totalAmount < goal.target) {
            const deficit = goal.target - totalAmount;
            console.log(
              `Baby ${baby.name} is ${deficit} ${goal.unit} short of feeding goal`
            );
            // Here you would send notifications to parents
          }
        } else if (goal.type === 'sleep') {
          const sleeps = await Sleep.find({
            baby: baby._id,
            startTime: { $gte: today, $lt: tomorrow },
          });

          const totalDuration = sleeps.reduce((sum, s) => sum + (s.duration || 0), 0);
          const totalHours = totalDuration / 60;

          if (totalHours < goal.target) {
            const deficit = goal.target - totalHours;
            console.log(
              `Baby ${baby.name} is ${deficit.toFixed(1)} hours short of sleep goal`
            );
            // Here you would send notifications to parents
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking daily goals:', error);
  }
};

export const startNotificationScheduler = () => {
  // Check goals every hour
  cron.schedule('0 * * * *', () => {
    console.log('Checking daily goals...');
    checkDailyGoals();
  });

  // Check goals at end of day (11 PM)
  cron.schedule('0 23 * * *', () => {
    console.log('End of day goal check...');
    checkDailyGoals();
  });

  console.log('Notification scheduler started');
};
