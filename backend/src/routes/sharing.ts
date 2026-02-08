import express from 'express';
import {
  createShareCode,
  acceptShareCode,
  getSharedAccess,
  revokeAccess,
  updatePermissions,
} from '../controllers/sharingController';
import { authenticate } from '../middleware/auth';
import { checkBabyAccess } from '../middleware/permissions';

const router = express.Router();

router.post('/create', authenticate, createShareCode);
router.post('/accept', authenticate, acceptShareCode);
router.get('/baby/:babyId', authenticate, checkBabyAccess, getSharedAccess);
router.delete('/:accessId', authenticate, revokeAccess);
router.put('/:accessId/permissions', authenticate, updatePermissions);

export default router;
