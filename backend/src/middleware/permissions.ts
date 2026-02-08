import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import SharedAccess from '../models/SharedAccess';
import Baby from '../models/Baby';

export const checkBabyAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const babyId = req.params.babyId || req.body.baby;
    const userId = req.user._id;

    const baby = await Baby.findById(babyId);
    if (!baby) {
      res.status(404).json({ error: 'Baby not found' });
      return;
    }

    const isParent = baby.parents.some(
      (parentId) => parentId.toString() === userId.toString()
    );

    if (isParent) {
      req.user.hasFullAccess = true;
      next();
      return;
    }

    const sharedAccess = await SharedAccess.findOne({
      baby: babyId,
      sharedWith: userId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    if (!sharedAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    req.user.permissions = sharedAccess.permissions;
    req.user.hasFullAccess = false;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Permission check failed' });
  }
};

export const checkPermission = (action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user.hasFullAccess) {
      next();
      return;
    }

    const permissions = req.user.permissions;
    if (!permissions || !permissions[action]) {
      res.status(403).json({ error: `Permission denied for action: ${action}` });
      return;
    }

    next();
  };
};
