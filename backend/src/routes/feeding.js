const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, checkBabyAccess, checkPermission } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create feeding log
router.post('/',
  authenticate,
  [
    body('babyId').isUUID(),
    body('type').isIn(['BOTTLE', 'BREAST_LEFT', 'BREAST_RIGHT', 'BREAST_BOTH', 'SOLID']),
    body('amountOz').isFloat({ min: 0 }),
    body('startTime').isISO8601(),
    body('endTime').optional().isISO8601(),
    body('notes').optional()
  ],
  checkBabyAccess,
  checkPermission('ADD_FEEDING'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const feedingLog = await prisma.feedingLog.create({
        data: {
          ...req.body,
          startTime: new Date(req.body.startTime),
          endTime: req.body.endTime ? new Date(req.body.endTime) : null,
          userId: req.user.id
        }
      });

      res.status(201).json(feedingLog);
    } catch (error) {
      console.error('Create feeding log error:', error);
      res.status(500).json({ error: 'Failed to create feeding log' });
    }
  }
);

// Get feeding logs for baby
router.get('/:babyId',
  authenticate,
  checkBabyAccess,
  checkPermission('VIEW_FEEDING'),
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

      const feedingLogs = await prisma.feedingLog.findMany({
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

      res.json(feedingLogs);
    } catch (error) {
      console.error('Get feeding logs error:', error);
      res.status(500).json({ error: 'Failed to fetch feeding logs' });
    }
  }
);

// Get feeding summary for today
router.get('/:babyId/summary/today',
  authenticate,
  checkBabyAccess,
  checkPermission('VIEW_FEEDING'),
  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const feedingLogs = await prisma.feedingLog.findMany({
        where: {
          babyId: req.params.babyId,
          startTime: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      const totalOz = feedingLogs.reduce((sum, log) => sum + log.amountOz, 0);
      const goalOz = req.baby.dailyFeedingGoalOz || 24;

      res.json({
        totalOz,
        goalOz,
        percentOfGoal: (totalOz / goalOz) * 100,
        feedingCount: feedingLogs.length,
        logs: feedingLogs
      });
    } catch (error) {
      console.error('Get feeding summary error:', error);
      res.status(500).json({ error: 'Failed to fetch feeding summary' });
    }
  }
);

// Update feeding log
router.put('/:id',
  authenticate,
  async (req, res) => {
    try {
      const feedingLog = await prisma.feedingLog.findUnique({
        where: { id: req.params.id },
        include: { baby: true }
      });

      if (!feedingLog) {
        return res.status(404).json({ error: 'Feeding log not found' });
      }

      // Check if user has access
      if (feedingLog.userId !== req.user.id && feedingLog.baby.parentId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedLog = await prisma.feedingLog.update({
        where: { id: req.params.id },
        data: {
          ...req.body,
          startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
          endTime: req.body.endTime ? new Date(req.body.endTime) : undefined
        }
      });

      res.json(updatedLog);
    } catch (error) {
      console.error('Update feeding log error:', error);
      res.status(500).json({ error: 'Failed to update feeding log' });
    }
  }
);

// Delete feeding log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const feedingLog = await prisma.feedingLog.findUnique({
      where: { id: req.params.id },
      include: { baby: true }
    });

    if (!feedingLog) {
      return res.status(404).json({ error: 'Feeding log not found' });
    }

    if (feedingLog.userId !== req.user.id && feedingLog.baby.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.feedingLog.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Feeding log deleted successfully' });
  } catch (error) {
    console.error('Delete feeding log error:', error);
    res.status(500).json({ error: 'Failed to delete feeding log' });
  }
});

module.exports = router;
