import express from 'express';
import {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
} from '../controllers/goalController';
import { authenticate } from '../middleware/auth';
import { checkBabyAccess } from '../middleware/permissions';

const router = express.Router();

router.post('/', authenticate, checkBabyAccess, createGoal);
router.get('/:babyId', authenticate, checkBabyAccess, getGoals);
router.put('/:goalId', authenticate, updateGoal);
router.delete('/:goalId', authenticate, deleteGoal);

export default router;
