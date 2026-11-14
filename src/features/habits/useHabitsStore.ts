import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Habit {
  id: string;
  title: string;
  streak: number;
  lastCompleted: string | null;
}

interface HabitsState {
  habits: Habit[];
  addHabit: (data: Omit<Habit, 'id' | 'streak' | 'lastCompleted'>) => void;
  removeHabit: (id: string) => void;
  updateHabit: (id: string, data: Partial<Habit>) => void;
  completeHabit: (id: string) => void;
  getAll: () => Habit[];
  getActiveCount: () => number;
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      addHabit: (data) =>
        set((state) => ({
          habits: [...state.habits, { id: uuid(), streak: 0, lastCompleted: null, ...data }],
        })),
      removeHabit: (id) =>
        set((state) => ({ habits: state.habits.filter((h) => h.id !== id) })),
      updateHabit: (id, data) =>
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...data } : h)),
        })),
      completeHabit: (id) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id
              ? {
                  ...h,
                  streak: h.streak + 1,
                  lastCompleted: new Date().toISOString(),
                }
              : h
          ),
        })),
      getAll: () => get().habits,
      getActiveCount: () => get().habits.length,
    }),
    { name: 'hey-habits-store' }
  )
);

export default useHabitsStore;