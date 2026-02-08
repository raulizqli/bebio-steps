import { create } from 'zustand';
import * as babiesApi from '../api/babies';
import * as trackingApi from '../api/tracking';
import type { Baby, DailySummary, TimelineEvent, DailyGoal } from '../types';

interface BabyState {
  babies: Baby[];
  currentBaby: Baby | null;
  summary: DailySummary | null;
  timeline: TimelineEvent[];
  isLoading: boolean;

  loadBabies: (familyId: string) => Promise<void>;
  setCurrentBaby: (baby: Baby) => void;
  createBaby: (data: Parameters<typeof babiesApi.createBaby>[0]) => Promise<Baby>;
  loadSummary: (babyId: string, date?: string) => Promise<void>;
  loadTimeline: (babyId: string, date?: string) => Promise<void>;
  setGoal: (babyId: string, goalType: string, targetValue: number) => Promise<void>;
}

export const useBabyStore = create<BabyState>((set, get) => ({
  babies: [],
  currentBaby: null,
  summary: null,
  timeline: [],
  isLoading: false,

  loadBabies: async (familyId) => {
    set({ isLoading: true });
    try {
      const babies = await babiesApi.getBabies(familyId);
      set({
        babies,
        currentBaby: get().currentBaby || babies[0] || null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setCurrentBaby: (baby) => set({ currentBaby: baby }),

  createBaby: async (data) => {
    const baby = await babiesApi.createBaby(data);
    set((state) => ({
      babies: [...state.babies, baby],
      currentBaby: state.currentBaby || baby,
    }));
    return baby;
  },

  loadSummary: async (babyId, date) => {
    try {
      const summary = await trackingApi.getDailySummary(babyId, date);
      set({ summary });
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  },

  loadTimeline: async (babyId, date) => {
    try {
      const data = await trackingApi.getTimeline(babyId, date);
      set({ timeline: data.timeline });
    } catch (error) {
      console.error('Failed to load timeline:', error);
    }
  },

  setGoal: async (babyId, goalType, targetValue) => {
    await babiesApi.setGoal(babyId, goalType, targetValue);
    // Reload summary to reflect updated goals
    await get().loadSummary(babyId);
  },
}));
