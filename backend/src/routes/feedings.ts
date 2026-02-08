import express from 'express';
import {
  createFeeding,
  getFeedings,
  updateFeeding,
  deleteFeeding,
  getDailyFeedingStats,
} from '../controllers/feedingController';
import { authenticate } from '../middleware/auth';
import { checkBabyAccess, checkPermission } from '../middleware/permissions';

const router = express.Router();

router.post('/', authenticate, checkBabyAccess, checkPermission('canEditFeeding'), createFeeding);
router.get('/:babyId', authenticate, checkBabyAccess, checkPermission('canViewFeeding'), getFeedings);
router.get('/:babyId/stats/daily', authenticate, checkBabyAccess, checkPermission('canViewFeeding'), getDailyFeedingStats);
router.put('/:feedingId', authenticate, checkPermission('canEditFeeding'), updateFeeding);
router.delete('/:feedingId', authenticate, checkPermission('canEditFeeding'), deleteFeeding);

export default router;
