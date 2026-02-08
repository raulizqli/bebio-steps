import { Response } from 'express';
import Symptom from '../models/Symptom';
import Disease from '../models/Disease';
import Medication from '../models/Medication';
import { AuthRequest } from '../middleware/auth';

export const createSymptom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { baby, name, severity, description, startTime, endTime } = req.body;
    const userId = req.user._id;

    const symptom = new Symptom({
      baby,
      name,
      severity,
      description,
      startTime,
      endTime,
      recordedBy: userId,
    });

    await symptom.save();

    res.status(201).json({
      message: 'Symptom recorded successfully',
      symptom,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record symptom' });
  }
};

export const getSymptoms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;

    const symptoms = await Symptom.find({ baby: babyId })
      .sort({ startTime: -1 })
      .populate('recordedBy', '-password');

    res.json({ symptoms });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get symptoms' });
  }
};

export const createDisease = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { baby, name, diagnosedDate, diagnosedBy, status, description, symptoms, notes } = req.body;
    const userId = req.user._id;

    const disease = new Disease({
      baby,
      name,
      diagnosedDate,
      diagnosedBy,
      status,
      description,
      symptoms,
      notes,
      recordedBy: userId,
    });

    await disease.save();

    res.status(201).json({
      message: 'Disease recorded successfully',
      disease,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record disease' });
  }
};

export const getDiseases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;

    const diseases = await Disease.find({ baby: babyId })
      .sort({ diagnosedDate: -1 })
      .populate('symptoms')
      .populate('medications')
      .populate('recordedBy', '-password');

    res.json({ diseases });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get diseases' });
  }
};

export const createMedication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { baby, name, dosage, frequency, startDate, endDate, prescribedBy, purpose, sideEffects } = req.body;
    const userId = req.user._id;

    const medication = new Medication({
      baby,
      name,
      dosage,
      frequency,
      startDate,
      endDate,
      prescribedBy,
      purpose,
      sideEffects,
      recordedBy: userId,
    });

    await medication.save();

    res.status(201).json({
      message: 'Medication recorded successfully',
      medication,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record medication' });
  }
};

export const getMedications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;
    const { isActive } = req.query;

    const query: any = { baby: babyId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const medications = await Medication.find(query)
      .sort({ startDate: -1 })
      .populate('recordedBy', '-password');

    res.json({ medications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get medications' });
  }
};

export const addMedicationAdministration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { medicationId } = req.params;
    const { time, notes } = req.body;
    const userId = req.user._id;

    const medication = await Medication.findById(medicationId);

    if (!medication) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }

    medication.administrations.push({
      time: time || new Date(),
      administeredBy: userId,
      notes,
    } as any);

    await medication.save();

    res.json({
      message: 'Medication administration recorded successfully',
      medication,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record medication administration' });
  }
};

export const updateMedication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { medicationId } = req.params;
    const updates = req.body;

    const medication = await Medication.findByIdAndUpdate(medicationId, updates, {
      new: true,
      runValidators: true,
    });

    if (!medication) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }

    res.json({ message: 'Medication updated successfully', medication });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update medication' });
  }
};
