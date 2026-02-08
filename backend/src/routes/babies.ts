import express from 'express';
import {
  createBaby,
  getBabies,
  getBaby,
  updateBaby,
  deleteBaby,
} from '../controllers/babyController';
import { authenticate } from '../middleware/auth';
import { checkBabyAccess } from '../middleware/permissions';

const router = express.Router();

router.post('/', authenticate, createBaby);
router.get('/', authenticate, getBabies);
router.get('/:babyId', authenticate, checkBabyAccess, getBaby);
router.put('/:babyId', authenticate, checkBabyAccess, updateBaby);
router.delete('/:babyId', authenticate, checkBabyAccess, deleteBaby);

export default router;
