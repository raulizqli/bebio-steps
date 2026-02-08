const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, checkBabyAccess, checkPermission } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create medication log
router.post('/',
  authenticate,
  [
    body('babyId').isUUID(),
    body('medicationName').trim().notEmpty(),
    body('dosage').trim().notEmpty(),
    body('frequency').trim().notEmpty(),
    body('startDate').isISO8601(),
    body('endDate').optional().isISO8601(),
    body('prescribedBy').optional(),
    body('notes').optional()
  ],
  checkBabyAccess,
  checkPermission('ADD_MEDICATION'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const medicationLog = await prisma.medicationLog.create({
        data: {
          ...req.body,
          startDate: new Date(req.body.startDate),
          endDate: req.body.endDate ? new Date(req.body.endDate) : null,
          userId: req.user.id
        }
      });

      res.status(201).json(medicationLog);
    } catch (error) {
      console.error('Create medication log error:', error);
      res.status(500).json({ error: 'Failed to create medication log' });
    }
  }
);

// Get medication logs for baby
router.get('/:babyId',
  authenticate,
  checkBabyAccess,
  checkPermission('VIEW_MEDICATION'),
  async (req, res) => {
    try {
      const { active, limit = 50, offset = 0 } = req.query;

      const where = { babyId: req.params.babyId };

      if (active === 'true') {
        where.OR = [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ];
      }

      const medicationLogs = await prisma.medicationLog.findMany({
        where,
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

      res.json(medicationLogs);
    } catch (error) {
      console.error('Get medication logs error:', error);
      res.status(500).json({ error: 'Failed to fetch medication logs' });
    }
  }
);

// Update medication log
router.put('/:id', authenticate, async (req, res) => {
  try {
    const medicationLog = await prisma.medicationLog.findUnique({
      where: { id: req.params.id },
      include: { baby: true }
    });

    if (!medicationLog) {
      return res.status(404).json({ error: 'Medication log not found' });
    }

    if (medicationLog.userId !== req.user.id && medicationLog.baby.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedLog = await prisma.medicationLog.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      }
    });

    res.json(updatedLog);
  } catch (error) {
    console.error('Update medication log error:', error);
    res.status(500).json({ error: 'Failed to update medication log' });
  }
});

// Delete medication log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const medicationLog = await prisma.medicationLog.findUnique({
      where: { id: req.params.id },
      include: { baby: true }
    });

    if (!medicationLog) {
      return res.status(404).json({ error: 'Medication log not found' });
    }

    if (medicationLog.userId !== req.user.id && medicationLog.baby.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.medicationLog.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Medication log deleted successfully' });
  } catch (error) {
    console.error('Delete medication log error:', error);
    res.status(500).json({ error: 'Failed to delete medication log' });
  }
});

module.exports = router;
