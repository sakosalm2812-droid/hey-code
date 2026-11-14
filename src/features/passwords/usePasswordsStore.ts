import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface PasswordEntry {
  id: string;
  site: string;
  username: string;
  password: string;
  category: string;
  createdAt: string;
}

interface PasswordsState {
  entries: PasswordEntry[];
  addEntry: (data: Omit<PasswordEntry, 'id' | 'createdAt'>) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, data: Partial<PasswordEntry>) => void;
  getAll: () => PasswordEntry[];
  getByCategory: (category: string) => PasswordEntry[];
}

export const usePasswordsStore = create<PasswordsState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (data) =>
        set((state) => ({
          entries: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              ...data,
            },
            ...state.entries,
          ],
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
      getByCategory: (category) =>
        get().entries.filter((e) => e.category === category),
    }),
    { name: 'hey-passwords-store' }
  )
);

export default usePasswordsStore;