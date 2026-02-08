import express from 'express';
import {
  createSleep,
  getSleeps,
  updateSleep,
  deleteSleep,
  getDailySleepStats,
} from '../controllers/sleepController';
import { authenticate } from '../middleware/auth';
import { checkBabyAccess, checkPermission } from '../middleware/permissions';

const router = express.Router();

router.post('/', authenticate, checkBabyAccess, checkPermission('canEditSleep'), createSleep);
router.get('/:babyId', authenticate, checkBabyAccess, checkPermission('canViewSleep'), getSleeps);
router.get('/:babyId/stats/daily', authenticate, checkBabyAccess, checkPermission('canViewSleep'), getDailySleepStats);
router.put('/:sleepId', authenticate, checkPermission('canEditSleep'), updateSleep);
router.delete('/:sleepId', authenticate, checkPermission('canEditSleep'), deleteSleep);

export default router;
