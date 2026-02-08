import { Response } from 'express';
import Sleep from '../models/Sleep';
import { AuthRequest } from '../middleware/auth';

export const createSleep = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { baby, startTime, endTime, quality, location, notes } = req.body;
    const userId = req.user._id;

    let duration;
    if (endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      duration = Math.round((end.getTime() - start.getTime()) / 60000);
    }

    const sleep = new Sleep({
      baby,
      startTime,
      endTime,
      duration,
      quality,
      location,
      notes,
      recordedBy: userId,
    });

    await sleep.save();

    res.status(201).json({
      message: 'Sleep recorded successfully',
      sleep,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record sleep' });
  }
};

export const getSleeps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;

    const query: any = { baby: babyId };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate as string);
      if (endDate) query.startTime.$lte = new Date(endDate as string);
    }

    const sleeps = await Sleep.find(query)
      .sort({ startTime: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .populate('recordedBy', '-password');

    const total = await Sleep.countDocuments(query);

    res.json({ sleeps, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sleeps' });
  }
};

export const updateSleep = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sleepId } = req.params;
    const updates = req.body;

    if (updates.endTime && updates.startTime) {
      const start = new Date(updates.startTime);
      const end = new Date(updates.endTime);
      updates.duration = Math.round((end.getTime() - start.getTime()) / 60000);
    }

    const sleep = await Sleep.findByIdAndUpdate(sleepId, updates, {
      new: true,
      runValidators: true,
    });

    if (!sleep) {
      res.status(404).json({ error: 'Sleep not found' });
      return;
    }

    res.json({ message: 'Sleep updated successfully', sleep });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sleep' });
  }
};

export const deleteSleep = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sleepId } = req.params;

    const sleep = await Sleep.findByIdAndDelete(sleepId);

    if (!sleep) {
      res.status(404).json({ error: 'Sleep not found' });
      return;
    }

    res.json({ message: 'Sleep deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sleep' });
  }
};

export const getDailySleepStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;
    const { date } = req.query;

    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sleeps = await Sleep.find({
      baby: babyId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
    });

    const totalDuration = sleeps.reduce((sum, sleep) => sum + (sleep.duration || 0), 0);
    const sleepCount = sleeps.length;

    res.json({
      date: targetDate,
      totalDuration,
      totalHours: Math.round((totalDuration / 60) * 10) / 10,
      sleepCount,
      sleeps,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sleep stats' });
  }
};
