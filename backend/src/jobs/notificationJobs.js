const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Check feeding and sleep goals every hour
cron.schedule('0 * * * *', async () => {
  logger.info('Running goal check job');
  
  try {
    await checkFeedingGoals();
    await checkSleepGoals();
    await checkExpiringShares();
  } catch (error) {
    logger.error('Goal check job error:', error);
  }
});

async function checkFeedingGoals() {
  const babies = await prisma.baby.findMany({
    where: {
      dailyFeedingGoalOz: { not: null }
    },
    include: {
      parent: true
    }
  });

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const baby of babies) {
    const feedingLogs = await prisma.feedingLog.findMany({
      where: {
        babyId: baby.id,
        startTime: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const totalOz = feedingLogs.reduce((sum, log) => sum + log.amountOz, 0);
    const goalOz = baby.dailyFeedingGoalOz;

    // Check if it's evening (6 PM) and goal not met
    if (now.getHours() === 18 && totalOz < goalOz) {
      const remaining = goalOz - totalOz;
      
      await prisma.notification.create({
        data: {
          userId: baby.parentId,
          babyId: baby.id,
          type: 'FEEDING_GOAL_NOT_MET',
          title: 'Meta de alimentación no alcanzada',
          message: `${baby.firstName} ha consumido ${totalOz.toFixed(1)}oz de ${goalOz}oz. Faltan ${remaining.toFixed(1)}oz.`
        }
      });

      logger.info(`Feeding goal notification sent for baby ${baby.id}`);
    }
  }
}

async function checkSleepGoals() {
  const babies = await prisma.baby.findMany({
    where: {
      dailySleepGoalHours: { not: null }
    },
    include: {
      parent: true
    }
  });

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const baby of babies) {
    const sleepLogs = await prisma.sleepLog.findMany({
      where: {
        babyId: baby.id,
        startTime: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    let totalHours = 0;
    sleepLogs.forEach(log => {
      if (log.endTime) {
        const hours = (log.endTime - log.startTime) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });

    const goalHours = baby.dailySleepGoalHours;

    // Check if it's evening (8 PM) and goal not met
    if (now.getHours() === 20 && totalHours < goalHours) {
      const remaining = goalHours - totalHours;
      
      await prisma.notification.create({
        data: {
          userId: baby.parentId,
          babyId: baby.id,
          type: 'SLEEP_GOAL_NOT_MET',
          title: 'Meta de sueño no alcanzada',
          message: `${baby.firstName} ha dormido ${totalHours.toFixed(1)}h de ${goalHours}h. Faltan ${remaining.toFixed(1)}h.`
        }
      });

      logger.info(`Sleep goal notification sent for baby ${baby.id}`);
    }
  }
}

async function checkExpiringShares() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const expiringShares = await prisma.sharedAccess.findMany({
    where: {
      isActive: true,
      expiresAt: {
        gte: new Date(),
        lte: tomorrow
      }
    },
    include: {
      baby: true,
      creator: true,
      user: true
    }
  });

  for (const share of expiringShares) {
    // Notify creator
    await prisma.notification.create({
      data: {
        userId: share.creatorId,
        babyId: share.babyId,
        type: 'SHARE_EXPIRING',
        title: 'Acceso compartido expirando',
        message: `El acceso compartido de ${share.baby.firstName} expira mañana.`
      }
    });

    // Notify user if they've redeemed the code
    if (share.userId) {
      await prisma.notification.create({
        data: {
          userId: share.userId,
          babyId: share.babyId,
          type: 'SHARE_EXPIRING',
          title: 'Tu acceso expirando',
          message: `Tu acceso a ${share.baby.firstName} expira mañana.`
        }
      });
    }
  }
}

logger.info('Notification cron jobs initialized');

module.exports = {
  checkFeedingGoals,
  checkSleepGoals,
  checkExpiringShares
};
