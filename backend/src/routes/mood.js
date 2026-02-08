const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, checkBabyAccess, checkPermission } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create mood log
router.post('/',
  authenticate,
  [
    body('babyId').isUUID(),
    body('mood').isIn(['HAPPY', 'CALM', 'FUSSY', 'CRYING', 'IRRITABLE', 'PLAYFUL', 'SLEEPY']),
    body('intensity').isInt({ min: 1, max: 10 }),
    body('triggers').isArray(),
    body('timestamp').isISO8601(),
    body('notes').optional()
  ],
  checkBabyAccess,
  checkPermission('ADD_MOOD'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const moodLog = await prisma.moodLog.create({
        data: {
          ...req.body,
          timestamp: new Date(req.body.timestamp),
          userId: req.user.id
        }
      });

      res.status(201).json(moodLog);
    } catch (error) {
      console.error('Create mood log error:', error);
      res.status(500).json({ error: 'Failed to create mood log' });
    }
  }
);

// Get mood logs for baby
router.get('/:babyId',
  authenticate,
  checkBabyAccess,
  checkPermission('VIEW_MOOD'),
  async (req, res) => {
    try {
      const { startDate, endDate, limit = 50, offset = 0 } = req.query;

      const where = {
        babyId: req.params.babyId
      };

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const moodLogs = await prisma.moodLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
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

      res.json(moodLogs);
    } catch (error) {
      console.error('Get mood logs error:', error);
      res.status(500).json({ error: 'Failed to fetch mood logs' });
    }
  }
);

// Update mood log
router.put('/:id', authenticate, async (req, res) => {
  try {
    const moodLog = await prisma.moodLog.findUnique({
      where: { id: req.params.id },
      include: { baby: true }
    });

    if (!moodLog) {
      return res.status(404).json({ error: 'Mood log not found' });
    }

    if (moodLog.userId !== req.user.id && moodLog.baby.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedLog = await prisma.moodLog.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined
      }
    });

    res.json(updatedLog);
  } catch (error) {
    console.error('Update mood log error:', error);
    res.status(500).json({ error: 'Failed to update mood log' });
  }
});

// Delete mood log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const moodLog = await prisma.moodLog.findUnique({
      where: { id: req.params.id },
      include: { baby: true }
    });

    if (!moodLog) {
      return res.status(404).json({ error: 'Mood log not found' });
    }

    if (moodLog.userId !== req.user.id && moodLog.baby.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.moodLog.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Mood log deleted successfully' });
  } catch (error) {
    console.error('Delete mood log error:', error);
    res.status(500).json({ error: 'Failed to delete mood log' });
  }
});

module.exports = router;
