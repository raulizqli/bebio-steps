import { Response } from 'express';
import Mood from '../models/Mood';
import { AuthRequest } from '../middleware/auth';

export const createMood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { baby, mood, intensity, timestamp, triggers, notes } = req.body;
    const userId = req.user._id;

    const moodRecord = new Mood({
      baby,
      mood,
      intensity,
      timestamp: timestamp || new Date(),
      triggers,
      notes,
      recordedBy: userId,
    });

    await moodRecord.save();

    res.status(201).json({
      message: 'Mood recorded successfully',
      mood: moodRecord,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record mood' });
  }
};

export const getMoods = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;

    const query: any = { baby: babyId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const moods = await Mood.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .populate('recordedBy', '-password');

    const total = await Mood.countDocuments(query);

    res.json({ moods, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get moods' });
  }
};

export const updateMood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { moodId } = req.params;
    const updates = req.body;

    const mood = await Mood.findByIdAndUpdate(moodId, updates, {
      new: true,
      runValidators: true,
    });

    if (!mood) {
      res.status(404).json({ error: 'Mood not found' });
      return;
    }

    res.json({ message: 'Mood updated successfully', mood });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update mood' });
  }
};

export const deleteMood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { moodId } = req.params;

    const mood = await Mood.findByIdAndDelete(moodId);

    if (!mood) {
      res.status(404).json({ error: 'Mood not found' });
      return;
    }

    res.json({ message: 'Mood deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete mood' });
  }
};
