import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Reminder {
  id: string;
  title: string;
  datetime: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  completed: boolean;
  createdAt: string;
}

interface RemindersState {
  reminders: Reminder[];
  addReminder: (data: Omit<Reminder, 'id' | 'createdAt' | 'completed'>) => void;
  removeReminder: (id: string) => void;
  updateReminder: (id: string, data: Partial<Reminder>) => void;
  markCompleted: (id: string) => void;
  getAll: () => Reminder[];
  getUpcoming: () => Reminder[];
}

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set, get) => ({
      reminders: [],
      addReminder: (data) =>
        set((state) => ({
          reminders: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              completed: false,
              ...data,
            },
            ...state.reminders,
          ],
        })),
      removeReminder: (id) =>
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        })),
      updateReminder: (id, data) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, ...data } : r
          ),
        })),
      markCompleted: (id) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, completed: true } : r
          ),
        })),
      getAll: () => get().reminders,
      getUpcoming: () =>
        get().reminders
          .filter((r) => !r.completed)
          .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()),
    }),
    { name: 'hey-reminders-store' }
  )
);

export default useRemindersStore;