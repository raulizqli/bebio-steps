import api from '../config/api';

export interface Goal {
  _id: string;
  baby: string;
  type: 'sleep' | 'feeding';
  target: number;
  unit: string;
  period: 'daily' | 'weekly';
  isActive: boolean;
}

export const goalService = {
  async createGoal(data: Partial<Goal>): Promise<Goal> {
    const response = await api.post('/goals', data);
    return response.data.goal;
  },

  async getGoals(babyId: string): Promise<Goal[]> {
    const response = await api.get(`/goals/${babyId}`);
    return response.data.goals;
  },

  async updateGoal(goalId: string, data: Partial<Goal>): Promise<Goal> {
    const response = await api.put(`/goals/${goalId}`, data);
    return response.data.goal;
  },

  async deleteGoal(goalId: string): Promise<void> {
    await api.delete(`/goals/${goalId}`);
  },
};
