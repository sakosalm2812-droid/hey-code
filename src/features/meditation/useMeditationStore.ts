import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface MeditationSession {
  id: string;
  duration: number;
  type: string;
  date: string;
}

interface MeditationState {
  sessions: MeditationSession[];
  addSession: (data: Omit<MeditationSession, 'id' | 'date'>) => void;
  removeSession: (id: string) => void;
  updateSession: (id: string, data: Partial<MeditationSession>) => void;
  getAll: () => MeditationSession[];
  getTotalMinutes: () => number;
}

export const useMeditationStore = create<MeditationState>()(
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
      getTotalMinutes: () =>
        get().sessions.reduce((sum, s) => sum + s.duration, 0),
    }),
    { name: 'hey-meditation-store' }
  )
);

export default useMeditationStore;