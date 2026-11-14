import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export type AudioFormat = 'mp3' | 'wav' | 'flac';

export interface AudioProject {
  id: string;
  title: string;
  duration: number;
  format: AudioFormat;
  createdAt: string;
}

interface AudioEditorState {
  projects: AudioProject[];
  addProject: (data: Omit<AudioProject, 'id' | 'createdAt'>) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, data: Partial<AudioProject>) => void;
  getAll: () => AudioProject[];
  getTotalDuration: () => number;
}

export const useAudioEditorStore = create<AudioEditorState>()(
  persist(
    (set, get) => ({
      projects: [],
      addProject: (data) =>
        set((state) => ({
          projects: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              ...data,
            },
            ...state.projects,
          ],
        })),
      removeProject: (id) =>
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),
      updateProject: (id, data) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),
      getAll: () => get().projects,
      getTotalDuration: () =>
        get().projects.reduce((sum, p) => sum + p.duration, 0),
    }),
    { name: 'hey-audioeditor-store' }
  )
);

export default useAudioEditorStore;