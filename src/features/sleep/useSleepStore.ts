import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface SleepEntry {
  id: string;
  bedtime: string;
  wakeTime: string;
  quality: number;
  date: string;
}

interface SleepState {
  entries: SleepEntry[];
  addEntry: (data: Omit<SleepEntry, 'id'>) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, data: Partial<SleepEntry>) => void;
  getAll: () => SleepEntry[];
  getAverageQuality: () => number;
}

export const useSleepStore = create<SleepState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (data) =>
        set((state) => ({
          entries: [...state.entries, { id: uuid(), ...data }],
        })),
      removeEntry: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      updateEntry: (id, data) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        })),
      getAll: () => get().entries,
      getAverageQuality: () => {
        const entries = get().entries;
        if (!entries.length) return 0;
        return entries.reduce((sum, e) => sum + e.quality, 0) / entries.length;
      },
    }),
    { name: 'hey-sleep-store' }
  )
);

export default useSleepStore;