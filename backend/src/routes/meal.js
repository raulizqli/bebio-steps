const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, checkBabyAccess, checkPermission } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create meal log
router.post('/',
  authenticate,
  [
    body('babyId').isUUID(),
    body('mealType').isIn(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
    body('foodItems').isArray(),
    body('amountEaten').optional(),
    body('timestamp').isISO8601(),
    body('notes').optional()
  ],
  checkBabyAccess,
  checkPermission('ADD_MEALS'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const mealLog = await prisma.mealLog.create({
        data: {
          ...req.body,
          timestamp: new Date(req.body.timestamp),
          userId: req.user.id
        }
      });

      res.status(201).json(mealLog);
    } catch (error) {
      console.error('Create meal log error:', error);
      res.status(500).json({ error: 'Failed to create meal log' });
    }
  }
);

// Get meal logs for baby
router.get('/:babyId',
  authenticate,
  checkBabyAccess,
  checkPermission('VIEW_MEALS'),
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

      const mealLogs = await prisma.mealLog.findMany({
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

      res.json(mealLogs);
    } catch (error) {
      console.error('Get meal logs error:', error);
      res.status(500).json({ error: 'Failed to fetch meal logs' });
    }
  }
);

// Update meal log
router.put('/:id', authenticate, async (req, res) => {
  try {
    const mealLog = await prisma.mealLog.findUnique({
      where: { id: req.params.id },
      include: { baby: true }
    });

    if (!mealLog) {
      return res.status(404).json({ error: 'Meal log not found' });
    }

    if (mealLog.userId !== req.user.id && mealLog.baby.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedLog = await prisma.mealLog.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined
      }
    });

    res.json(updatedLog);
  } catch (error) {
    console.error('Update meal log error:', error);
    res.status(500).json({ error: 'Failed to update meal log' });
  }
});

// Delete meal log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const mealLog = await prisma.mealLog.findUnique({
      where: { id: req.params.id },
      include: { baby: true }
    });

    if (!mealLog) {
      return res.status(404).json({ error: 'Meal log not found' });
    }

    if (mealLog.userId !== req.user.id && mealLog.baby.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.mealLog.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Meal log deleted successfully' });
  } catch (error) {
    console.error('Delete meal log error:', error);
    res.status(500).json({ error: 'Failed to delete meal log' });
  }
});

module.exports = router;
