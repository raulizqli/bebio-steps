const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, checkBabyAccess, checkPermission } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create illness log
router.post('/',
  authenticate,
  [
    body('babyId').isUUID(),
    body('illnessName').trim().notEmpty(),
    body('symptoms').isArray(),
    body('severity').isIn(['MILD', 'MODERATE', 'SEVERE']),
    body('startDate').isISO8601(),
    body('endDate').optional().isISO8601(),
    body('notes').optional()
  ],
  checkBabyAccess,
  checkPermission('ADD_ILLNESS'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const illnessLog = await prisma.illnessLog.create({
        data: {
          ...req.body,
          startDate: new Date(req.body.startDate),
          endDate: req.body.endDate ? new Date(req.body.endDate) : null,
          userId: req.user.id
        }
      });

      res.status(201).json(illnessLog);
    } catch (error) {
      console.error('Create illness log error:', error);
      res.status(500).json({ error: 'Failed to create illness log' });
    }
  }
);

// Get illness logs for baby
router.get('/:babyId',
  authenticate,
  checkBabyAccess,
  checkPermission('VIEW_ILLNESS'),
  async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const illnessLogs = await prisma.illnessLog.findMany({
        where: { babyId: req.params.babyId },
        orderBy: { startDate: 'desc' },
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

      res.json(illnessLogs);
    } catch (error) {
      console.error('Get illness logs error:', error);
      res.status(500).json({ error: 'Failed to fetch illness logs' });
    }
  }
);

// Update illness log
router.put('/:id', authenticate, async (req, res) => {
  try {
    const illnessLog = await prisma.illnessLog.findUnique({
      where: { id: req.params.id },
      include: { baby: true }
    });

    if (!illnessLog) {
      return res.status(404).json({ error: 'Illness log not found' });
    }

    if (illnessLog.userId !== req.user.id && illnessLog.baby.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedLog = await prisma.illnessLog.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      }
    });

    res.json(updatedLog);
  } catch (error) {
    console.error('Update illness log error:', error);
    res.status(500).json({ error: 'Failed to update illness log' });
  }
});

// Delete illness log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const illnessLog = await prisma.illnessLog.findUnique({
      where: { id: req.params.id },
      include: { baby: true }
    });

    if (!illnessLog) {
      return res.status(404).json({ error: 'Illness log not found' });
    }

    if (illnessLog.userId !== req.user.id && illnessLog.baby.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.illnessLog.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Illness log deleted successfully' });
  } catch (error) {
    console.error('Delete illness log error:', error);
    res.status(500).json({ error: 'Failed to delete illness log' });
  }
});

module.exports = router;
