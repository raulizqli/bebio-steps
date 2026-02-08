import express from 'express';
import {
  createSymptom,
  getSymptoms,
  createDisease,
  getDiseases,
  createMedication,
  getMedications,
  addMedicationAdministration,
  updateMedication,
} from '../controllers/healthController';
import { authenticate } from '../middleware/auth';
import { checkBabyAccess, checkPermission } from '../middleware/permissions';

const router = express.Router();

router.post('/symptoms', authenticate, checkBabyAccess, checkPermission('canEditHealth'), createSymptom);
router.get('/symptoms/:babyId', authenticate, checkBabyAccess, checkPermission('canViewHealth'), getSymptoms);

router.post('/diseases', authenticate, checkBabyAccess, checkPermission('canEditHealth'), createDisease);
router.get('/diseases/:babyId', authenticate, checkBabyAccess, checkPermission('canViewHealth'), getDiseases);

router.post('/medications', authenticate, checkBabyAccess, checkPermission('canEditHealth'), createMedication);
router.get('/medications/:babyId', authenticate, checkBabyAccess, checkPermission('canViewHealth'), getMedications);
router.post('/medications/:medicationId/administration', authenticate, checkPermission('canEditHealth'), addMedicationAdministration);
router.put('/medications/:medicationId', authenticate, checkPermission('canEditHealth'), updateMedication);

export default router;
