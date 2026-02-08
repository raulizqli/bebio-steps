const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

// Alexa skill verification middleware
const verifyAlexaRequest = (req, res, next) => {
  // In production, you should verify the request signature
  // For now, we'll use a simple token-based auth
  const alexaToken = req.headers['x-alexa-token'];
  
  if (!alexaToken) {
    return res.status(401).json({ error: 'Missing Alexa token' });
  }

  try {
    const decoded = jwt.verify(alexaToken, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid Alexa token' });
  }
};

// Alexa intent handler
router.post('/intent', verifyAlexaRequest, async (req, res) => {
  try {
    const { intent, slots } = req.body;

    switch (intent) {
      case 'LogFeedingIntent':
        return await handleLogFeeding(req, res, slots);
      
      case 'LogSleepIntent':
        return await handleLogSleep(req, res, slots);
      
      case 'GetFeedingSummaryIntent':
        return await handleGetFeedingSummary(req, res, slots);
      
      case 'GetSleepSummaryIntent':
        return await handleGetSleepSummary(req, res, slots);
      
      case 'LogMoodIntent':
        return await handleLogMood(req, res, slots);
      
      default:
        res.json({
          speech: 'Lo siento, no entendí esa solicitud.',
          shouldEndSession: false
        });
    }
  } catch (error) {
    console.error('Alexa intent error:', error);
    res.status(500).json({
      speech: 'Hubo un error procesando tu solicitud.',
      shouldEndSession: true
    });
  }
});

async function handleLogFeeding(req, res, slots) {
  try {
    const { babyName, amount, type } = slots;

    // Find baby
    const baby = await prisma.baby.findFirst({
      where: {
        parentId: req.userId,
        firstName: { contains: babyName, mode: 'insensitive' }
      }
    });

    if (!baby) {
      return res.json({
        speech: `No encontré un bebé con el nombre ${babyName}.`,
        shouldEndSession: false
      });
    }

    // Create feeding log
    await prisma.feedingLog.create({
      data: {
        babyId: baby.id,
        userId: req.userId,
        type: type || 'BOTTLE',
        amountOz: parseFloat(amount),
        startTime: new Date()
      }
    });

    res.json({
      speech: `He registrado ${amount} onzas de alimentación para ${babyName}.`,
      shouldEndSession: true
    });
  } catch (error) {
    throw error;
  }
}

async function handleLogSleep(req, res, slots) {
  try {
    const { babyName, duration } = slots;

    const baby = await prisma.baby.findFirst({
      where: {
        parentId: req.userId,
        firstName: { contains: babyName, mode: 'insensitive' }
      }
    });

    if (!baby) {
      return res.json({
        speech: `No encontré un bebé con el nombre ${babyName}.`,
        shouldEndSession: false
      });
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - (parseFloat(duration) * 60 * 60 * 1000));

    await prisma.sleepLog.create({
      data: {
        babyId: baby.id,
        userId: req.userId,
        startTime,
        endTime: now
      }
    });

    res.json({
      speech: `He registrado ${duration} horas de sueño para ${babyName}.`,
      shouldEndSession: true
    });
  } catch (error) {
    throw error;
  }
}

async function handleGetFeedingSummary(req, res, slots) {
  try {
    const { babyName } = slots;

    const baby = await prisma.baby.findFirst({
      where: {
        parentId: req.userId,
        firstName: { contains: babyName, mode: 'insensitive' }
      }
    });

    if (!baby) {
      return res.json({
        speech: `No encontré un bebé con el nombre ${babyName}.`,
        shouldEndSession: false
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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
    const goalOz = baby.dailyFeedingGoalOz || 24;
    const remaining = goalOz - totalOz;

    let speech = `${babyName} ha consumido ${totalOz.toFixed(1)} onzas hoy. `;
    if (remaining > 0) {
      speech += `Faltan ${remaining.toFixed(1)} onzas para alcanzar el objetivo de ${goalOz} onzas.`;
    } else {
      speech += `¡Ha alcanzado el objetivo de ${goalOz} onzas!`;
    }

    res.json({
      speech,
      shouldEndSession: true
    });
  } catch (error) {
    throw error;
  }
}

async function handleGetSleepSummary(req, res, slots) {
  try {
    const { babyName } = slots;

    const baby = await prisma.baby.findFirst({
      where: {
        parentId: req.userId,
        firstName: { contains: babyName, mode: 'insensitive' }
      }
    });

    if (!baby) {
      return res.json({
        speech: `No encontré un bebé con el nombre ${babyName}.`,
        shouldEndSession: false
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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

    const goalHours = baby.dailySleepGoalHours || 14;
    const remaining = goalHours - totalHours;

    let speech = `${babyName} ha dormido ${totalHours.toFixed(1)} horas hoy. `;
    if (remaining > 0) {
      speech += `Faltan ${remaining.toFixed(1)} horas para alcanzar el objetivo de ${goalHours} horas.`;
    } else {
      speech += `¡Ha alcanzado el objetivo de ${goalHours} horas!`;
    }

    res.json({
      speech,
      shouldEndSession: true
    });
  } catch (error) {
    throw error;
  }
}

async function handleLogMood(req, res, slots) {
  try {
    const { babyName, mood } = slots;

    const baby = await prisma.baby.findFirst({
      where: {
        parentId: req.userId,
        firstName: { contains: babyName, mode: 'insensitive' }
      }
    });

    if (!baby) {
      return res.json({
        speech: `No encontré un bebé con el nombre ${babyName}.`,
        shouldEndSession: false
      });
    }

    await prisma.moodLog.create({
      data: {
        babyId: baby.id,
        userId: req.userId,
        mood: mood.toUpperCase(),
        intensity: 5,
        triggers: [],
        timestamp: new Date()
      }
    });

    res.json({
      speech: `He registrado que ${babyName} está ${mood}.`,
      shouldEndSession: true
    });
  } catch (error) {
    throw error;
  }
}

// Generate Alexa auth token
router.post('/auth/link', async (req, res) => {
  try {
    const { email, password } = req.body;
    const bcrypt = require('bcryptjs');

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '365d' } // Long-lived for Alexa
    );

    res.json({ alexaToken: token });
  } catch (error) {
    console.error('Alexa auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;
