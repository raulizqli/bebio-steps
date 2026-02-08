const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, checkBabyAccess } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create baby
router.post('/',
  authenticate,
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('dateOfBirth').isISO8601(),
    body('gender').optional(),
    body('dailyFeedingGoalOz').optional().isFloat({ min: 0 }),
    body('dailySleepGoalHours').optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const baby = await prisma.baby.create({
        data: {
          ...req.body,
          dateOfBirth: new Date(req.body.dateOfBirth),
          parentId: req.user.id
        }
      });

      res.status(201).json(baby);
    } catch (error) {
      console.error('Create baby error:', error);
      res.status(500).json({ error: 'Failed to create baby' });
    }
  }
);

// Get all babies for user
router.get('/', authenticate, async (req, res) => {
  try {
    // Get babies owned by user
    const ownedBabies = await prisma.baby.findMany({
      where: { parentId: req.user.id }
    });

    // Get babies shared with user
    const sharedAccess = await prisma.sharedAccess.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      include: {
        baby: true
      }
    });

    const sharedBabies = sharedAccess.map(access => ({
      ...access.baby,
      isShared: true,
      permissions: access.permissions,
      expiresAt: access.expiresAt
    }));

    res.json({
      owned: ownedBabies,
      shared: sharedBabies
    });
  } catch (error) {
    console.error('Get babies error:', error);
    res.status(500).json({ error: 'Failed to fetch babies' });
  }
});

// Get baby by ID
router.get('/:babyId', authenticate, checkBabyAccess, async (req, res) => {
  res.json(req.baby);
});

// Update baby
router.put('/:babyId',
  authenticate,
  checkBabyAccess,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional(),
    body('dailyFeedingGoalOz').optional().isFloat({ min: 0 }),
    body('dailySleepGoalHours').optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    try {
      if (!req.isParent) {
        return res.status(403).json({ error: 'Only parents can update baby information' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updatedBaby = await prisma.baby.update({
        where: { id: req.params.babyId },
        data: {
          ...req.body,
          dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined
        }
      });

      res.json(updatedBaby);
    } catch (error) {
      console.error('Update baby error:', error);
      res.status(500).json({ error: 'Failed to update baby' });
    }
  }
);

// Delete baby
router.delete('/:babyId', authenticate, checkBabyAccess, async (req, res) => {
  try {
    if (!req.isParent) {
      return res.status(403).json({ error: 'Only parents can delete baby' });
    }

    await prisma.baby.delete({
      where: { id: req.params.babyId }
    });

    res.json({ message: 'Baby deleted successfully' });
  } catch (error) {
    console.error('Delete baby error:', error);
    res.status(500).json({ error: 'Failed to delete baby' });
  }
});

module.exports = router;
