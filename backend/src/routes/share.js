const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const { body, validationResult } = require('express-validator');
const { authenticate, checkBabyAccess } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create share code
router.post('/create',
  authenticate,
  [
    body('babyId').isUUID(),
    body('permissions').isArray().notEmpty(),
    body('expiresAt').optional().isISO8601()
  ],
  checkBabyAccess,
  async (req, res) => {
    try {
      if (!req.isParent) {
        return res.status(403).json({ error: 'Only parents can create share codes' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { babyId, permissions, expiresAt } = req.body;

      // Generate unique share code
      const shareCode = nanoid(10);

      const sharedAccess = await prisma.sharedAccess.create({
        data: {
          shareCode,
          babyId,
          creatorId: req.user.id,
          permissions,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        },
        include: {
          baby: true
        }
      });

      res.status(201).json(sharedAccess);
    } catch (error) {
      console.error('Create share code error:', error);
      res.status(500).json({ error: 'Failed to create share code' });
    }
  }
);

// Redeem share code
router.post('/redeem',
  authenticate,
  [
    body('shareCode').trim().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { shareCode } = req.body;

      // Find the share
      const sharedAccess = await prisma.sharedAccess.findUnique({
        where: { shareCode },
        include: { baby: true }
      });

      if (!sharedAccess) {
        return res.status(404).json({ error: 'Share code not found' });
      }

      if (!sharedAccess.isActive) {
        return res.status(400).json({ error: 'Share code is inactive' });
      }

      if (sharedAccess.expiresAt && sharedAccess.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Share code has expired' });
      }

      if (sharedAccess.userId) {
        return res.status(400).json({ error: 'Share code has already been redeemed' });
      }

      // Check if user is the parent
      if (sharedAccess.baby.parentId === req.user.id) {
        return res.status(400).json({ error: 'You are already the parent of this baby' });
      }

      // Redeem the code
      const updatedAccess = await prisma.sharedAccess.update({
        where: { shareCode },
        data: { userId: req.user.id },
        include: { baby: true }
      });

      res.json(updatedAccess);
    } catch (error) {
      console.error('Redeem share code error:', error);
      res.status(500).json({ error: 'Failed to redeem share code' });
    }
  }
);

// Get all shares for a baby
router.get('/baby/:babyId',
  authenticate,
  checkBabyAccess,
  async (req, res) => {
    try {
      if (!req.isParent) {
        return res.status(403).json({ error: 'Only parents can view share codes' });
      }

      const shares = await prisma.sharedAccess.findMany({
        where: { babyId: req.params.babyId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          creator: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(shares);
    } catch (error) {
      console.error('Get shares error:', error);
      res.status(500).json({ error: 'Failed to fetch shares' });
    }
  }
);

// Revoke share access
router.delete('/:shareId',
  authenticate,
  async (req, res) => {
    try {
      const share = await prisma.sharedAccess.findUnique({
        where: { id: req.params.shareId },
        include: { baby: true }
      });

      if (!share) {
        return res.status(404).json({ error: 'Share not found' });
      }

      // Only parent or creator can revoke
      if (share.baby.parentId !== req.user.id && share.creatorId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await prisma.sharedAccess.update({
        where: { id: req.params.shareId },
        data: { isActive: false }
      });

      res.json({ message: 'Share access revoked successfully' });
    } catch (error) {
      console.error('Revoke share error:', error);
      res.status(500).json({ error: 'Failed to revoke share' });
    }
  }
);

// Update share permissions
router.put('/:shareId',
  authenticate,
  [
    body('permissions').optional().isArray(),
    body('expiresAt').optional().isISO8601(),
    body('isActive').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const share = await prisma.sharedAccess.findUnique({
        where: { id: req.params.shareId },
        include: { baby: true }
      });

      if (!share) {
        return res.status(404).json({ error: 'Share not found' });
      }

      if (share.baby.parentId !== req.user.id && share.creatorId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updatedShare = await prisma.sharedAccess.update({
        where: { id: req.params.shareId },
        data: {
          ...req.body,
          expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
        }
      });

      res.json(updatedShare);
    } catch (error) {
      console.error('Update share error:', error);
      res.status(500).json({ error: 'Failed to update share' });
    }
  }
);

module.exports = router;
