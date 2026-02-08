import { Response } from 'express';
import Baby from '../models/Baby';
import { AuthRequest } from '../middleware/auth';

export const createBaby = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, dateOfBirth, gender, weight, height, bloodType, allergies } = req.body;
    const userId = req.user._id;

    const baby = new Baby({
      name,
      dateOfBirth,
      gender,
      parents: [userId],
      weight,
      height,
      bloodType,
      allergies,
    });

    await baby.save();

    res.status(201).json({
      message: 'Baby profile created successfully',
      baby,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create baby profile' });
  }
};

export const getBabies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;

    const babies = await Baby.find({ parents: userId }).populate('parents', '-password');

    res.json({ babies });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get babies' });
  }
};

export const getBaby = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;

    const baby = await Baby.findById(babyId).populate('parents', '-password');

    if (!baby) {
      res.status(404).json({ error: 'Baby not found' });
      return;
    }

    res.json({ baby });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get baby' });
  }
};

export const updateBaby = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;
    const { name, weight, height, bloodType, allergies } = req.body;

    const baby = await Baby.findByIdAndUpdate(
      babyId,
      { name, weight, height, bloodType, allergies },
      { new: true, runValidators: true }
    );

    if (!baby) {
      res.status(404).json({ error: 'Baby not found' });
      return;
    }

    res.json({ message: 'Baby profile updated successfully', baby });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update baby' });
  }
};

export const deleteBaby = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;

    const baby = await Baby.findByIdAndDelete(babyId);

    if (!baby) {
      res.status(404).json({ error: 'Baby not found' });
      return;
    }

    res.json({ message: 'Baby profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete baby' });
  }
};
