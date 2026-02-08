import { Response } from 'express';
import Goal from '../models/Goal';
import { AuthRequest } from '../middleware/auth';

export const createGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { baby, type, target, unit, period } = req.body;
    const userId = req.user._id;

    const goal = new Goal({
      baby,
      type,
      target,
      unit,
      period,
      createdBy: userId,
    });

    await goal.save();

    res.status(201).json({
      message: 'Goal created successfully',
      goal,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

export const getGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { babyId } = req.params;

    const goals = await Goal.find({ baby: babyId, isActive: true });

    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get goals' });
  }
};

export const updateGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { goalId } = req.params;
    const updates = req.body;

    const goal = await Goal.findByIdAndUpdate(goalId, updates, {
      new: true,
      runValidators: true,
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.json({ message: 'Goal updated successfully', goal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { goalId } = req.params;

    const goal = await Goal.findByIdAndUpdate(
      goalId,
      { isActive: false },
      { new: true }
    );

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.json({ message: 'Goal deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};
