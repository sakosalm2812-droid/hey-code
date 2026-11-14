import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface FocusSession {
  id: string;
  duration: number;
  type: 'work' | 'break';
  date: string;
}

interface FocusState {
  sessions: FocusSession[];
  addSession: (data: Omit<FocusSession, 'id' | 'date'>) => void;
  removeSession: (id: string) => void;
  updateSession: (id: string, data: Partial<FocusSession>) => void;
  getAll: () => FocusSession[];
  getTotalWorkMinutes: () => number;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      sessions: [],
      addSession: (data) =>
        set((state) => ({
          sessions: [
            ...state.sessions,
            { id: uuid(), date: new Date().toISOString(), ...data },
          ],
        })),
      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),
      updateSession: (id, data) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),
      getAll: () => get().sessions,
      getTotalWorkMinutes: () =>
        get().sessions
          .filter((s) => s.type === 'work')
          .reduce((sum, s) => sum + s.duration, 0),
    }),
    { name: 'hey-focus-store' }
  )
);

export default useFocusStore;