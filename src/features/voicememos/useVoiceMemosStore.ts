import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface VoiceMemo {
  id: string;
  title: string;
  duration: number;
  tags: string[];
  url?: string;
  createdAt: string;
}

interface VoiceMemosState {
  memos: VoiceMemo[];
  addMemo: (data: Omit<VoiceMemo, 'id' | 'createdAt'>) => void;
  removeMemo: (id: string) => void;
  updateMemo: (id: string, data: Partial<VoiceMemo>) => void;
  getAll: () => VoiceMemo[];
  getTotalDuration: () => number;
}

export const useVoiceMemosStore = create<VoiceMemosState>()(
  persist(
    (set, get) => ({
      memos: [],
      addMemo: (data) =>
        set((state) => ({
          memos: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              ...data,
            },
            ...state.memos,
          ],
        })),
      removeMemo: (id) =>
        set((state) => ({ memos: state.memos.filter((m) => m.id !== id) })),
      updateMemo: (id, data) =>
        set((state) => ({
          memos: state.memos.map((m) =>
            m.id === id ? { ...m, ...data } : m
          ),
        })),
      getAll: () => get().memos,
      getTotalDuration: () =>
        get().memos.reduce((sum, m) => sum + m.duration, 0),
    }),
    { name: 'hey-voicememos-store' }
  )
);

export default useVoiceMemosStore;