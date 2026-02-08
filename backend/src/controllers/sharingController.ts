import { Response } from 'express';
import SharedAccess from '../models/SharedAccess';
import Baby from '../models/Baby';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { generateShareCode } from '../utils/auth';

export const createShareCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId, permissions, expiresInDays } = req.body;
    const userId = req.user._id;

    const baby = await Baby.findById(babyId);
    if (!baby) {
      res.status(404).json({ error: 'Baby not found' });
      return;
    }

    const isParent = baby.parents.some(
      (parentId) => parentId.toString() === userId.toString()
    );

    if (!isParent) {
      res.status(403).json({ error: 'Only parents can create share codes' });
      return;
    }

    const shareCode = generateShareCode();
    let expiresAt;

    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const sharedAccess = new SharedAccess({
      baby: babyId,
      sharedBy: userId,
      shareCode,
      permissions: permissions || {},
      expiresAt,
    });

    await sharedAccess.save();

    res.status(201).json({
      message: 'Share code created successfully',
      shareCode,
      expiresAt,
      sharedAccess,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create share code' });
  }
};

export const acceptShareCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shareCode } = req.body;
    const userId = req.user._id;

    const sharedAccess = await SharedAccess.findOne({ shareCode, isActive: true });

    if (!sharedAccess) {
      res.status(404).json({ error: 'Invalid or expired share code' });
      return;
    }

    if (sharedAccess.expiresAt && sharedAccess.expiresAt < new Date()) {
      res.status(400).json({ error: 'Share code has expired' });
      return;
    }

    if (sharedAccess.sharedWith) {
      res.status(400).json({ error: 'Share code already used' });
      return;
    }

    sharedAccess.sharedWith = userId;
    await sharedAccess.save();

    const baby = await Baby.findById(sharedAccess.baby);

    res.json({
      message: 'Access granted successfully',
      baby,
      permissions: sharedAccess.permissions,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept share code' });
  }
};

export const getSharedAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;
    const userId = req.user._id;

    const baby = await Baby.findById(babyId);
    if (!baby) {
      res.status(404).json({ error: 'Baby not found' });
      return;
    }

    const isParent = baby.parents.some(
      (parentId) => parentId.toString() === userId.toString()
    );

    if (!isParent) {
      res.status(403).json({ error: 'Only parents can view shared access' });
      return;
    }

    const sharedAccess = await SharedAccess.find({ baby: babyId, isActive: true })
      .populate('sharedWith', '-password')
      .populate('sharedBy', '-password');

    res.json({ sharedAccess });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get shared access' });
  }
};

export const revokeAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accessId } = req.params;
    const userId = req.user._id;

    const sharedAccess = await SharedAccess.findById(accessId);

    if (!sharedAccess) {
      res.status(404).json({ error: 'Access not found' });
      return;
    }

    const baby = await Baby.findById(sharedAccess.baby);
    if (!baby) {
      res.status(404).json({ error: 'Baby not found' });
      return;
    }

    const isParent = baby.parents.some(
      (parentId) => parentId.toString() === userId.toString()
    );

    if (!isParent) {
      res.status(403).json({ error: 'Only parents can revoke access' });
      return;
    }

    sharedAccess.isActive = false;
    sharedAccess.revokedAt = new Date();
    sharedAccess.revokedBy = userId;
    await sharedAccess.save();

    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke access' });
  }
};

export const updatePermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accessId } = req.params;
    const { permissions } = req.body;
    const userId = req.user._id;

    const sharedAccess = await SharedAccess.findById(accessId);

    if (!sharedAccess) {
      res.status(404).json({ error: 'Access not found' });
      return;
    }

    const baby = await Baby.findById(sharedAccess.baby);
    if (!baby) {
      res.status(404).json({ error: 'Baby not found' });
      return;
    }

    const isParent = baby.parents.some(
      (parentId) => parentId.toString() === userId.toString()
    );

    if (!isParent) {
      res.status(403).json({ error: 'Only parents can update permissions' });
      return;
    }

    sharedAccess.permissions = { ...sharedAccess.permissions, ...permissions };
    await sharedAccess.save();

    res.json({ message: 'Permissions updated successfully', sharedAccess });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update permissions' });
  }
};
