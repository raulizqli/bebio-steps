const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, checkBabyAccess, checkPermission } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create sleep log
router.post('/',
  authenticate,
  [
    body('babyId').isUUID(),
    body('startTime').isISO8601(),
    body('endTime').optional().isISO8601(),
    body('quality').optional().isIn(['POOR', 'FAIR', 'GOOD', 'EXCELLENT']),
    body('location').optional(),
    body('notes').optional()
  ],
  checkBabyAccess,
  checkPermission('ADD_SLEEP'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const sleepLog = await prisma.sleepLog.create({
        data: {
          ...req.body,
          startTime: new Date(req.body.startTime),
          endTime: req.body.endTime ? new Date(req.body.endTime) : null,
          userId: req.user.id
        }
      });

      res.status(201).json(sleepLog);
    } catch (error) {
      console.error('Create sleep log error:', error);
      res.status(500).json({ error: 'Failed to create sleep log' });
    }
  }
);

// Get sleep logs for baby
router.get('/:babyId',
  authenticate,
  checkBabyAccess,
  checkPermission('VIEW_SLEEP'),
  async (req, res) => {
    try {
      const { startDate, endDate, limit = 50, offset = 0 } = req.query;

      const where = {
        babyId: req.params.babyId
      };

      if (startDate || endDate) {
        where.startTime = {};
        if (startDate) where.startTime.gte = new Date(startDate);
        if (endDate) where.startTime.lte = new Date(endDate);
      }

      const sleepLogs = await prisma.sleepLog.findMany({
        where,
        orderBy: { startTime: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      res.json(sleepLogs);
    } catch (error) {
      console.error('Get sleep logs error:', error);
      res.status(500).json({ error: 'Failed to fetch sleep logs' });
    }
  }
);

// Get sleep summary for today
router.get('/:babyId/summary/today',
  authenticate,
  checkBabyAccess,
  checkPermission('VIEW_SLEEP'),
  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sleepLogs = await prisma.sleepLog.findMany({
        where: {
          babyId: req.params.babyId,
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

      const goalHours = req.baby.dailySleepGoalHours || 14;

      res.json({
        totalHours,
        goalHours,
        percentOfGoal: (totalHours / goalHours) * 100,
        sleepCount: sleepLogs.length,
        logs: sleepLogs
      });
    } catch (error) {
      console.error('Get sleep summary error:', error);
      res.status(500).json({ error: 'Failed to fetch sleep summary' });
    }
  }
);

// Update sleep log
router.put('/:id',
  authenticate,
  async (req, res) => {
    try {
      const sleepLog = await prisma.sleepLog.findUnique({
        where: { id: req.params.id },
        include: { baby: true }
      });

      if (!sleepLog) {
        return res.status(404).json({ error: 'Sleep log not found' });
      }

      if (sleepLog.userId !== req.user.id && sleepLog.baby.parentId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedLog = await prisma.sleepLog.update({
        where: { id: req.params.id },
        data: {
          ...req.body,
          startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
          endTime: req.body.endTime ? new Date(req.body.endTime) : undefined
        }
      });

      res.json(updatedLog);
    } catch (error) {
      console.error('Update sleep log error:', error);
      res.status(500).json({ error: 'Failed to update sleep log' });
    }
  }
);

// Delete sleep log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const sleepLog = await prisma.sleepLog.findUnique({
      where: { id: req.params.id },
      include: { baby: true }
    });

    if (!sleepLog) {
      return res.status(404).json({ error: 'Sleep log not found' });
    }

    if (sleepLog.userId !== req.user.id && sleepLog.baby.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.sleepLog.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Sleep log deleted successfully' });
  } catch (error) {
    console.error('Delete sleep log error:', error);
    res.status(500).json({ error: 'Failed to delete sleep log' });
  }
});

module.exports = router;
