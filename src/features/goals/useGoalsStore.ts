import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  createdAt: string;
}

interface GoalsState {
  goals: Goal[];
  addGoal: (data: Omit<Goal, 'id' | 'createdAt' | 'current'>) => void;
  removeGoal: (id: string) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  incrementProgress: (id: string, amount?: number) => void;
  getAll: () => Goal[];
  getCompletionRate: (id: string) => number;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      addGoal: (data) =>
        set((state) => ({
          goals: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              current: 0,
              ...data,
            },
            ...state.goals,
          ],
        })),
      removeGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),
      updateGoal: (id, data) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...data } : g
          ),
        })),
      incrementProgress: (id, amount = 1) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? { ...g, current: Math.min(g.target, g.current + amount) }
              : g
          ),
        })),
      getAll: () => get().goals,
      getCompletionRate: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal || goal.target === 0) return 0;
        return Math.round((goal.current / goal.target) * 100);
      },
    }),
    { name: 'hey-goals-store' }
  )
);

export default useGoalsStore;