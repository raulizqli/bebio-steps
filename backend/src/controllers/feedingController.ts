import { Response } from 'express';
import Feeding from '../models/Feeding';
import { AuthRequest } from '../middleware/auth';

export const createFeeding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { baby, type, amount, unit, side, duration, startTime, endTime, notes } = req.body;
    const userId = req.user._id;

    const feeding = new Feeding({
      baby,
      type,
      amount,
      unit,
      side,
      duration,
      startTime,
      endTime,
      notes,
      recordedBy: userId,
    });

    await feeding.save();

    res.status(201).json({
      message: 'Feeding recorded successfully',
      feeding,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record feeding' });
  }
};

export const getFeedings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;

    const query: any = { baby: babyId };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate as string);
      if (endDate) query.startTime.$lte = new Date(endDate as string);
    }

    const feedings = await Feeding.find(query)
      .sort({ startTime: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .populate('recordedBy', '-password');

    const total = await Feeding.countDocuments(query);

    res.json({ feedings, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get feedings' });
  }
};

export const updateFeeding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { feedingId } = req.params;
    const updates = req.body;

    const feeding = await Feeding.findByIdAndUpdate(feedingId, updates, {
      new: true,
      runValidators: true,
    });

    if (!feeding) {
      res.status(404).json({ error: 'Feeding not found' });
      return;
    }

    res.json({ message: 'Feeding updated successfully', feeding });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update feeding' });
  }
};

export const deleteFeeding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { feedingId } = req.params;

    const feeding = await Feeding.findByIdAndDelete(feedingId);

    if (!feeding) {
      res.status(404).json({ error: 'Feeding not found' });
      return;
    }

    res.json({ message: 'Feeding deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete feeding' });
  }
};

export const getDailyFeedingStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;
    const { date } = req.query;

    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const feedings = await Feeding.find({
      baby: babyId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
    });

    const totalAmount = feedings.reduce((sum, feeding) => sum + (feeding.amount || 0), 0);
    const feedingCount = feedings.length;

    res.json({
      date: targetDate,
      totalAmount,
      feedingCount,
      feedings,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get feeding stats' });
  }
};
