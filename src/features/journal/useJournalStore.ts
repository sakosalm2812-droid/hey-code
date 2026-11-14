import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  createdAt: string;
}

interface JournalState {
  entries: JournalEntry[];
  addEntry: (data: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, data: Partial<JournalEntry>) => void;
  getAll: () => JournalEntry[];
  getEntriesByMood: (mood: string) => JournalEntry[];
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (data) =>
        set((state) => ({
          entries: [
            ...state.entries,
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              ...data,
            },
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
      getEntriesByMood: (mood) =>
        get().entries.filter((e) => e.mood === mood),
    }),
    { name: 'hey-journal-store' }
  )
);

export default useJournalStore;