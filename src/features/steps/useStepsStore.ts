import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface StepsEntry {
  id: string;
  steps: number;
  date: string;
}

interface StepsState {
  entries: StepsEntry[];
  addEntry: (data: Omit<StepsEntry, 'id' | 'date'>) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, data: Partial<StepsEntry>) => void;
  getAll: () => StepsEntry[];
  getAverageSteps: () => number;
}

export const useStepsStore = create<StepsState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (data) =>
        set((state) => ({
          entries: [
            ...state.entries,
            { id: uuid(), date: new Date().toISOString(), ...data },
          ],
        })),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      updateEntry: (id, data) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        })),
      getAll: () => get().entries,
      getAverageSteps: () => {
        const entries = get().entries;
        if (!entries.length) return 0;
        return entries.reduce((sum, e) => sum + e.steps, 0) / entries.length;
      },
    }),
    { name: 'hey-steps-store' }
  )
);

export default useStepsStore;