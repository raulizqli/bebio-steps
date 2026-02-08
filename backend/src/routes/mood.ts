import express from 'express';
import {
  createMood,
  getMoods,
  updateMood,
  deleteMood,
} from '../controllers/moodController';
import { authenticate } from '../middleware/auth';
import { checkBabyAccess, checkPermission } from '../middleware/permissions';

const router = express.Router();

router.post('/', authenticate, checkBabyAccess, checkPermission('canEditMood'), createMood);
router.get('/:babyId', authenticate, checkBabyAccess, checkPermission('canViewMood'), getMoods);
router.put('/:moodId', authenticate, checkPermission('canEditMood'), updateMood);
router.delete('/:moodId', authenticate, checkPermission('canEditMood'), deleteMood);

export default router;
